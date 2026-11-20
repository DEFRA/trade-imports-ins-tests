import dotenv from 'dotenv';
import { request } from '@playwright/test';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { E2E_ORGANISATION_ID } from '@adapters/http/organisation';
import { E2E_ADDRESS_BOOK_FIXTURES, ensureE2eAddressBook } from '@flows/shared/address-book-seed';
import { testRecordNameTemplateOf } from '@domain/shared/constants/test-record-names';
import { getEnvironment, isCdpLocal, throwIfProdEnvironment } from '@utils/playwright/environment';
import { cdpServiceUrl } from '@utils/playwright/cdp-service-url';

dotenv.config({ quiet: true });

const USAGE = `Usage: npm run reset:e2e-address-book -- [--apply] [--transporters]

Soft-deletes the records tests leave behind in the shared e2e organisation's
address book on the CDP environment ENVIRONMENT (or PLAYWRIGHT_ENVIRONMENT)
names. Only records whose name matches a template in
domain/shared/constants/test-record-names.ts are deleted; every other record is kept.

  --apply         delete the records (default: a dry run that only reports)
  --transporters  cover transporters too (default: addresses only)
  --help          print this text`;

interface ResetOptions {
  apply: boolean;
  transporters: boolean;
}

interface NamedRecord {
  id: string;
  name: string;
}

interface RecordKind {
  label: string;
  listLive: () => Promise<NamedRecord[]>;
  softDelete: (recordId: string) => Promise<void>;
}

interface Sorted {
  deletes: { record: NamedRecord; template: string }[];
  kept: NamedRecord[];
}

const parseOptions = (argv: readonly string[]): ResetOptions => {
  const known = ['--apply', '--transporters'];
  const unknown = argv.filter((arg) => !known.includes(arg));
  if (unknown.length > 0) {
    throw new Error(`Unknown option ${unknown.join(' ')}\n\n${USAGE}`);
  }
  return { apply: argv.includes('--apply'), transporters: argv.includes('--transporters') };
};

const targetEnvironment = (): string => {
  const environment = getEnvironment();
  if (!environment) {
    throw new Error('Set ENVIRONMENT (or PLAYWRIGHT_ENVIRONMENT) to the CDP environment to reset, such as dev or test.');
  }
  return environment;
};

const isOwnedByAnotherSuite = (name: string): boolean => {
  const seededNames = new Set(E2E_ADDRESS_BOOK_FIXTURES.map((fixture) => fixture.name));
  return seededNames.has(name) || name === 'Perf Test Holding' || /^Address Book Load \d+$/.test(name);
};

const sortRecords = (records: readonly NamedRecord[]): Sorted => {
  const sorted: Sorted = { deletes: [], kept: [] };
  for (const record of records) {
    const template = isOwnedByAnotherSuite(record.name) ? undefined : testRecordNameTemplateOf(record.name);
    if (template) {
      sorted.deletes.push({ record, template });
    } else {
      sorted.kept.push(record);
    }
  }
  return sorted;
};

const nameWithStampsCollapsed = (name: string): string =>
  name.replaceAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32}|\d{10,}/g, '<stamp>');

const commonest = (values: readonly string[], limit = Infinity): [string, number][] => {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([, a], [, b]) => b - a).slice(0, limit);
};

const printCounts = (heading: string, counts: readonly [string, number][]): void => {
  console.log(heading);
  for (const [value, count] of counts) {
    console.log(`  ${String(count).padStart(6)}  ${value}`);
  }
};

const printReport = (kind: RecordKind, live: number, { deletes, kept }: Sorted): void => {
  console.log(`\n${kind.label}: ${live} live, ${deletes.length} would delete, ${kept.length} would keep`);
  printCounts('Would delete, by name template:', commonest(deletes.map(({ template }) => template)));
  printCounts(
    'Commonest kept names:',
    commonest(
      kept.map(({ name }) => nameWithStampsCollapsed(name)),
      30,
    ),
  );
};

const deleteOneByOne = async (kind: RecordKind, deletes: Sorted['deletes']): Promise<NamedRecord[]> => {
  const progressEvery = 250;
  const failed: NamedRecord[] = [];
  for (const [index, { record }] of deletes.entries()) {
    try {
      await kind.softDelete(record.id);
    } catch (error) {
      console.warn(`Could not delete ${kind.label} record ${record.id} "${record.name}"`, error);
      failed.push(record);
    }
    if ((index + 1) % progressEvery === 0) {
      console.log(`  ${index + 1} of ${deletes.length} ${kind.label} records processed`);
    }
  }
  return failed;
};

const resetKind = async (kind: RecordKind, { apply }: ResetOptions): Promise<{ failedDeletes: number }> => {
  const live = await kind.listLive();
  const sorted = sortRecords(live);
  printReport(kind, live.length, sorted);
  if (!apply) return { failedDeletes: 0 };

  console.log(`\nDeleting ${sorted.deletes.length} ${kind.label} records one at a time ...`);
  const failed = await deleteOneByOne(kind, sorted.deletes);
  const liveAfter = (await kind.listLive()).length;
  console.log(`${kind.label}: deleted ${sorted.deletes.length - failed.length}, failed ${failed.length}, ${liveAfter} live now`);
  for (const record of failed) {
    console.log(`  failed: ${record.id} "${record.name}"`);
  }
  return { failedDeletes: failed.length };
};

const recordKinds = (api: AddressBookApiClient, { transporters }: ResetOptions): RecordKind[] => {
  const addresses: RecordKind = {
    label: 'Addresses',
    listLive: () => api.listAddressesOnEveryPage(''),
    softDelete: (addressId) => api.deleteAddress(addressId),
  };
  if (!transporters) return [addresses];
  return [
    addresses,
    {
      label: 'Transporters',
      listLive: () => api.listTransportersOnEveryPage(''),
      softDelete: (transporterId) => api.deleteTransporter(transporterId),
    },
  ];
};

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  if (argv.includes('--help')) {
    console.log(USAGE);
    return;
  }
  const options = parseOptions(argv);
  const environment = targetEnvironment();
  const addressBookUrl = cdpServiceUrl('trade-imports-address-book', environment);
  console.log(`Environment:  ${environment}${isCdpLocal() ? ' (through the developer gateway)' : ''}`);
  console.log(`Organisation: ${E2E_ORGANISATION_ID}`);
  console.log(`Address book: ${addressBookUrl}`);
  console.log(`Mode:         ${options.apply ? 'apply: records will be deleted' : 'dry run: nothing is deleted'}`);
  console.log(`Covers:       ${options.transporters ? 'addresses and transporters' : 'addresses'}`);
  throwIfProdEnvironment(environment);

  const context = await request.newContext();
  try {
    const api = new AddressBookApiClient(context, { baseUrl: addressBookUrl });
    let failedDeletes = 0;
    for (const kind of recordKinds(api, options)) {
      failedDeletes += (await resetKind(kind, options)).failedDeletes;
    }
    if (failedDeletes > 0) process.exitCode = 1;
    if (options.apply) {
      await ensureE2eAddressBook(api);
      console.log('\nSeeded e2e address book records are in place.');
    }
  } finally {
    await context.dispose();
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

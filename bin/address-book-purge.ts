import dotenv from 'dotenv';
import { request } from '@playwright/test';
import { RestClient, RestClientError, RestClientTransportError } from '@adapters/http/rest-client';
import { AddressBookApiClient, E2E_ORGANISATION_ID, type AddressBookRecord } from '@adapters/http/address-book-api-client';
import { E2E_ADDRESS_BOOK_FIXTURES } from '@domain/fixtures/e2e-address-book';
import { getEnvironment, throwIfProdEnvironment } from '@utils/playwright/environment';
import { cdpServiceUrl } from '@utils/playwright/cdp-service-url';
import { getDeveloperApiKey } from '@config/service-base-urls';

dotenv.config({ quiet: true });

// Mirrors the private header name in AddressBookApiClient — not exported, so repeated here.
const ORGANISATION_ID_HEADER = 'Trade-Imports-Organisation-Id';

type AddressBookRecordWithMeta = AddressBookRecord & { createdAt?: string };

interface AddressBookPageResponse {
  items: AddressBookRecordWithMeta[];
  totalPages: number;
}

interface DeleteRule {
  pattern: RegExp;
  source: string;
}

const STAMP = String.raw`\d{10,}`;
const UUID = String.raw`[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`;

/**
 * One rule per createAddress/equivalent call in tests/, fixtures/, flows/, domain/, excluding
 * domain/fixtures/e2e-address-book.ts (the protected global book — see GLOBAL_NAMES below). A
 * rename target is listed against the create it belongs to, since a leaked record may carry
 * either name depending on how far its test got.
 */
const DELETE_RULES: DeleteRule[] = [
  { pattern: new RegExp(`^Linked Farm ${STAMP}$`), source: 'tests/e2e/features/addresses-live-link.spec.ts:16' },
  { pattern: new RegExp(`^Renamed Holding ${STAMP}$`), source: 'tests/e2e/features/addresses-live-link.spec.ts:16 (renamed :46)' },
  { pattern: new RegExp(`^Linked Origin ${STAMP}$`), source: 'tests/e2e/features/addresses-live-link.spec.ts:86' },
  { pattern: new RegExp(`^Renamed Origin ${STAMP}$`), source: 'tests/e2e/features/addresses-live-link.spec.ts:86 (renamed :110)' },
  { pattern: new RegExp(`^Doomed Farm ${STAMP}$`), source: 'tests/e2e/features/addresses-live-link.spec.ts:139' },
  { pattern: new RegExp(`^Replaceable Farm ${STAMP}$`), source: 'tests/e2e/features/addresses-live-link.spec.ts:191' },
  { pattern: new RegExp(`^Danish Meat Export Kolding${STAMP}$`), source: 'tests/e2e/features/addresses-picker.spec.ts:16' },
  { pattern: new RegExp(`^Jutland Swine Kolding${STAMP}$`), source: 'tests/e2e/features/addresses-picker.spec.ts:16' },
  { pattern: new RegExp(`^Paged Consignor ${STAMP}$`), source: 'tests/e2e/features/addresses-picker.spec.ts:30' },
  { pattern: new RegExp(String.raw`^Newer Than Target ${STAMP} \d+$`), source: 'tests/e2e/features/addresses-picker.spec.ts:40' },
  { pattern: new RegExp(`^Frozen Origin ${STAMP}$`), source: 'tests/e2e/features/addresses-submit-freeze.spec.ts:16' },
  { pattern: new RegExp(`^Live Origin ${STAMP}$`), source: 'tests/e2e/features/addresses-submit-freeze.spec.ts:16 (renamed :244)' },
  { pattern: new RegExp(`^Frozen Then Deleted ${STAMP}$`), source: 'tests/e2e/features/addresses-submit-freeze.spec.ts:93' },
  { pattern: new RegExp(`^Delete Test Farm ${STAMP}$`), source: 'tests/e2e/features/ins/address-book-delete.spec.ts:18' },
  { pattern: new RegExp(`^Delete Cross User Farm ${STAMP}$`), source: 'tests/e2e/features/ins/address-book-delete.spec.ts:37' },
  { pattern: new RegExp(`^Cross User Farm ${STAMP}$`), source: 'tests/e2e/features/ins/address-book-cross-user-visibility.spec.ts:8' },
  { pattern: new RegExp(`^Edit Test Farm ${STAMP}$`), source: 'tests/e2e/features/ins/address-book-edit.spec.ts:17' },
  { pattern: new RegExp(`^Edit Test Farm ${STAMP} Renamed$`), source: 'tests/e2e/features/ins/address-book-edit.spec.ts:17 (renamed :19)' },
  { pattern: new RegExp(`^Edit Listing Farm ${STAMP}$`), source: 'tests/e2e/features/ins/address-book-edit.spec.ts:54' },
  { pattern: new RegExp(`^Relisted Holding ${STAMP}$`), source: 'tests/e2e/features/ins/address-book-edit.spec.ts:54 (renamed :56)' },
  { pattern: new RegExp(`^Highland Nurseries Kirkcaldy${STAMP}$`), source: 'tests/e2e/features/plants/destination.spec.ts:162' },
  { pattern: new RegExp(`^Tayside Growers Kirkcaldy${STAMP}$`), source: 'tests/e2e/features/plants/destination.spec.ts:162' },
  { pattern: new RegExp(`^Target Nursery Peterhead${STAMP}$`), source: 'tests/e2e/features/plants/destination.spec.ts:197' },
  {
    pattern: new RegExp(String.raw`^Newer Than Target Peterhead${STAMP} \d+$`),
    source: 'tests/e2e/features/plants/destination.spec.ts:199',
  },
  { pattern: new RegExp(`^Doomed Nursery Montrose${STAMP}$`), source: 'tests/e2e/features/plants/destination.spec.ts:233' },
  { pattern: new RegExp(`^Review Nursery ${UUID}$`), source: 'tests/e2e/features/plants/review.spec.ts:25' },
  { pattern: new RegExp(`^Parties Nursery ${UUID}$`), source: 'tests/e2e/features/plants/parties.spec.ts:69' },
  { pattern: new RegExp(`^Potato Destination ${UUID}$`), source: 'tests/e2e/features/plants/parties.spec.ts:122' },
  { pattern: new RegExp(`^Numbers Nursery ${UUID}$`), source: 'tests/e2e/features/plants/parties.spec.ts:154' },
  { pattern: new RegExp(`^Scope Nursery ${UUID}$`), source: 'tests/e2e/features/plants/parties.spec.ts:190' },
  { pattern: new RegExp(String.raw`^Contact ${UUID} \d+$`), source: 'tests/e2e/features/plants/contact.spec.ts:47' },
  { pattern: new RegExp(`^Review ${UUID}$`), source: 'tests/e2e/features/plants/contact.spec.ts:81' },
  { pattern: new RegExp(`^Journey Nursery ${UUID}$`), source: 'tests/e2e/features/plants/journey.spec.ts:59' },
];

const GLOBAL_NAMES = new Set(E2E_ADDRESS_BOOK_FIXTURES.map((fixture) => fixture.name));

interface Classified {
  record: AddressBookRecordWithMeta;
  action: 'delete' | 'keep';
  reason: string;
}

/** Every ACTIVE address for the organisation, across every page. Tombstones are already excluded server-side. */
async function listAllAddresses(rest: RestClient, orgId: string): Promise<AddressBookRecordWithMeta[]> {
  const headers = { [ORGANISATION_ID_HEADER]: orgId };
  const all: AddressBookRecordWithMeta[] = [];
  let page = 1;
  for (;;) {
    const result = await rest.get<AddressBookPageResponse>(`/organisation/${orgId}/addresses?page=${page}`, headers);
    all.push(...result.items);
    if (page >= result.totalPages) break;
    page += 1;
  }
  return all;
}

function matchDeleteRule(name: string): DeleteRule | undefined {
  return DELETE_RULES.find((rule) => rule.pattern.test(name));
}

/**
 * For each global-book name, works out which live record `ensureE2eAddressBook` treats as the
 * one true copy: the first match its own `listAddresses(name)` search returns. That record is
 * always kept; any other record sharing the name is judged like any other candidate.
 */
async function resolveGlobalBookKeepers(addressBookApi: AddressBookApiClient): Promise<Map<string, string>> {
  const keeperIdByName = new Map<string, string>();
  for (const name of GLOBAL_NAMES) {
    const matches = (await addressBookApi.listAddresses(name)).filter((item) => item.name === name);
    if (matches.length > 0) keeperIdByName.set(name, matches[0].id);
  }
  return keeperIdByName;
}

function classify(records: AddressBookRecordWithMeta[], globalKeeperIdByName: Map<string, string>): Classified[] {
  return records.map((record) => {
    if (GLOBAL_NAMES.has(record.name)) {
      if (globalKeeperIdByName.get(record.name) === record.id) {
        return { record, action: 'keep', reason: 'global E2E journey address book (ensureE2eAddressBook keeps this one)' };
      }
      const rule = matchDeleteRule(record.name);
      if (rule) return { record, action: 'delete', reason: rule.source };
      return { record, action: 'keep', reason: `unrecognised duplicate of global-book name "${record.name}"` };
    }
    const rule = matchDeleteRule(record.name);
    if (rule) return { record, action: 'delete', reason: rule.source };
    return { record, action: 'keep', reason: 'unrecognised' };
  });
}

function printDeleteTable(toDelete: Classified[]): void {
  console.log(`\nWould delete: ${toDelete.length}`);
  if (toDelete.length === 0) {
    console.log('(none)');
    return;
  }
  console.table(
    toDelete.map(({ record, reason }) => ({
      Name: record.name,
      Id: record.id,
      Created: record.createdAt ?? 'n/a',
      Source: reason,
    })),
  );
}

function printKeepTable(toKeep: Classified[]): void {
  console.log(`\nKeeping: ${toKeep.length}`);
  if (toKeep.length === 0) {
    console.log('(none)');
    return;
  }
  console.table(toKeep.map(({ record, reason }) => ({ Name: record.name, Id: record.id, Reason: reason })));
}

function describeRequestFailure(error: unknown): string {
  if (error instanceof RestClientError) return `${error.method} ${error.url} -> ${error.status}`;
  if (error instanceof RestClientTransportError) return `${error.method} ${error.url} -> no response`;
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : 'unknown error';
}

/** Sequential, never parallel. A 404 counts as already gone; any other failure stops the run. */
async function applyDeletes(addressBookApi: AddressBookApiClient, toDelete: Classified[]): Promise<void> {
  let done = 0;
  for (const { record } of toDelete) {
    try {
      await addressBookApi.deleteAddress(record.id);
      done += 1;
    } catch (error) {
      if (error instanceof RestClientError && error.status === 404) {
        done += 1;
        continue;
      }
      console.error(`\nStopped after deleting ${done} of ${toDelete.length}.`);
      console.error(describeRequestFailure(error));
      process.exitCode = 1;
      return;
    }
  }
  console.log(`\nDeleted ${done} of ${toDelete.length}.`);
}

async function main(): Promise<void> {
  throwIfProdEnvironment();
  const environment = getEnvironment();
  if (!environment) {
    throw new Error('Set ENVIRONMENT (or PLAYWRIGHT_ENVIRONMENT) to pick a target.');
  }
  const apply = process.argv.includes('--apply');

  const baseUrl = cdpServiceUrl('trade-imports-address-book', environment);
  const apiKey = getDeveloperApiKey();
  const requestContext = await request.newContext();

  try {
    const rest = new RestClient(baseUrl, requestContext, apiKey);
    const addressBookApi = new AddressBookApiClient(requestContext, E2E_ORGANISATION_ID, baseUrl, apiKey);

    console.log(`Listing organisation ${E2E_ORGANISATION_ID}'s address book at ${baseUrl} ...`);
    const records = await listAllAddresses(rest, E2E_ORGANISATION_ID);
    const globalKeeperIdByName = await resolveGlobalBookKeepers(addressBookApi);
    const classified = classify(records, globalKeeperIdByName);

    const toDelete = classified.filter((item) => item.action === 'delete');
    const toKeep = classified.filter((item) => item.action === 'keep');

    console.log(`\n${records.length} live addresses total.`);
    printDeleteTable(toDelete);
    printKeepTable(toKeep);

    if (!apply) {
      console.log('\nDry run only — pass --apply to delete the records listed above.');
      return;
    }

    console.log(`\nApplying: deleting ${toDelete.length} addresses sequentially ...`);
    await applyDeletes(addressBookApi, toDelete);
  } finally {
    await requestContext.dispose();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof RestClientError || error instanceof RestClientTransportError ? describeRequestFailure(error) : error);
  process.exitCode = 1;
});

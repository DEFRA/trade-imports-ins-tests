import { expect, type Locator } from '@playwright/test';
import type { AddressBookApiClient, AddressBookRequest, AddressBookRecord } from '@adapters/http/address-book-api-client';
import { timeouts } from '@config/timeouts';
import { ADDRESSES_A_PAGE, pickerResultsCount } from '@page-objects/shared/address-picker-results';
import type { AddressRole } from '@domain/shared/constants/address-types';
import {
  heldAsConsignee,
  heldAsConsignor,
  heldAsImporter,
  heldAsPlaceOfDestination,
  heldAsPlaceOfOrigin,
} from '@domain/shared/constants/address-types';
import {
  CONSIGNEE_NAME,
  CONSIGNOR_NAME,
  DESTINATION_NAME,
  IMPORTER_NAME,
  PLACE_OF_ORIGIN_NAME,
} from '@domain/shared/constants/journey-party-names';

export const placeOfOriginFixture: AddressBookRequest = {
  name: PLACE_OF_ORIGIN_NAME,
  addressLine1: '1 Farm Lane',
  townOrCity: 'Ennis',
  postcode: 'V95 X7P2',
  countryCode: 'IE',
  phone: '+44 1234 567890',
  email: 'contact@example.com',
  ...heldAsPlaceOfOrigin,
};

export const consignorFixture: AddressBookRequest = {
  name: CONSIGNOR_NAME,
  addressLine1: '43 East Hague Extension',
  townOrCity: 'Bern',
  postcode: '30055',
  countryCode: 'CH',
  phone: '+44 1234 567890',
  email: 'contact@example.com',
  ...heldAsConsignor,
};

export const frenchConsignorFixture: AddressBookRequest = {
  name: 'Laiterie du Nord SARL',
  addressLine1: '12 Rue de la Gare',
  townOrCity: 'Lille',
  postcode: '59000',
  countryCode: 'FR',
  phone: '+44 1234 567890',
  email: 'contact@example.com',
  ...heldAsConsignor,
};

export const destinationFixture: AddressBookRequest = {
  name: DESTINATION_NAME,
  addressLine1: '18 Dockside Road',
  townOrCity: 'London',
  postcode: 'E14 9GE',
  countryCode: 'GB',
  phone: '+44 1234 567890',
  email: 'contact@example.com',
  ...heldAsPlaceOfDestination,
};

/** The shared address-book records, in creation order. */
export const E2E_ADDRESS_BOOK_FIXTURES: readonly AddressBookRequest[] = [
  {
    name: 'Alpine Dairy GmbH',
    addressLine1: 'Bahnhofstrasse 17',
    townOrCity: 'Innsbruck',
    postcode: '6020',
    countryCode: 'AT',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsConsignor,
  },
  {
    name: 'Irish Beef Traders Ltd',
    addressLine1: 'Castle Road 9',
    townOrCity: 'Kilkenny',
    postcode: 'R95 F2X8',
    countryCode: 'IE',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsConsignor,
  },
  {
    name: 'Iberian Swine SA',
    addressLine1: 'Calle Mayor 44',
    townOrCity: 'Huesca',
    postcode: '22001',
    countryCode: 'ES',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsConsignor,
  },
  {
    name: 'Danish Meat Export ApS',
    addressLine1: 'Havnegade 21',
    townOrCity: 'Copenhagen',
    postcode: '1058',
    countryCode: 'DK',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsConsignor,
  },
  {
    name: 'Jutland Swine ApS',
    addressLine1: 'Sondergade 4',
    townOrCity: 'Aarhus',
    postcode: '8000',
    countryCode: 'DK',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsConsignor,
  },
  frenchConsignorFixture,
  {
    name: 'Nordvik Seafood AS',
    addressLine1: 'Havnegata 8',
    townOrCity: 'Alesund',
    postcode: '6002',
    countryCode: 'NO',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsConsignor,
  },
  consignorFixture,
  destinationFixture,
  placeOfOriginFixture,
  {
    name: CONSIGNEE_NAME,
    addressLine1: '10 Market Street',
    townOrCity: 'Leeds',
    postcode: 'LS1 6HB',
    countryCode: 'GB',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsConsignee,
  },
  {
    name: IMPORTER_NAME,
    addressLine1: '20 Trade Road',
    townOrCity: 'London',
    postcode: 'EC1A 1BB',
    countryCode: 'GB',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsImporter,
  },
];

const sameValue = (live: unknown, wanted: unknown): boolean =>
  Array.isArray(wanted) ? JSON.stringify(live) === JSON.stringify(wanted) : live === wanted;

const differsFrom = (live: AddressBookRecord, wanted: AddressBookRequest): boolean =>
  (Object.keys(wanted) as Array<keyof AddressBookRequest>).some((field) => !sameValue(live[field], wanted[field]));

/**
 * Ensures one live record per journey fixture name, holding the fixture's details and roles.
 * Creates a missing record, rewrites one that differs and soft-deletes any extra with the name.
 */
export async function ensureE2eAddressBook(api: AddressBookApiClient): Promise<void> {
  for (const record of E2E_ADDRESS_BOOK_FIXTURES) {
    const matches = (await api.listAddressesOnEveryPage(record.name)).filter((item) => item.name === record.name);
    if (matches.length === 0) {
      await api.createAddress(record);
      continue;
    }
    const [keeper, ...extras] = matches;
    if (differsFrom(keeper, record)) {
      await api.updateAddress(keeper.id, record);
    }
    for (const extra of extras) {
      await api.deleteAddress(extra.id);
    }
  }
}

interface CountrySearchPicker {
  search(term: string): Promise<void>;
  resultsSummary: Locator;
  listedRows: Locator;
  listedRowsOutsideCountry(countryLabel: string): Locator;
}

interface CountrySearch {
  term: string;
  countryCode: string;
  countryLabel: string;
  role: AddressRole;
}

/**
 * Saves the record, then searches the picker for the term until the picker and the address book answer from one
 * moment: the picker's found count equals the number of the role's addresses the book matches to the term or to the
 * country code, the saved record is among them, and every row listed reads the country label.
 */
export async function saveAddressThenExpectCountrySearchListsIt(
  api: AddressBookApiClient,
  picker: CountrySearchPicker,
  record: AddressBookRequest,
  { term, countryCode, countryLabel, role }: CountrySearch,
): Promise<void> {
  const saved = await api.createAddress(record);
  await expect(async () => {
    await picker.search(term);
    const offered = (await api.listAddressesOnEveryPage(term, [countryCode])).filter(
      (address) => address.roles.length === 0 || address.roles.includes(role),
    );
    const shown = Math.min(offered.length, ADDRESSES_A_PAGE);
    expect(offered.map((address) => address.id)).toContain(saved.id);
    await expect(picker.resultsSummary).toHaveText(pickerResultsCount(shown, offered.length), { timeout: timeouts.veryShort });
    await expect(picker.listedRows).toHaveCount(shown, { timeout: timeouts.veryShort });
    await expect(picker.listedRowsOutsideCountry(countryLabel)).toHaveCount(0, { timeout: timeouts.veryShort });
  }).toPass({ timeout: timeouts.long });
}

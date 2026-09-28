import type { AddressBookApiClient, AddressBookRecord } from '@adapters/http/address-book-api-client';

type AddressBookCreate = Omit<AddressBookRecord, 'id' | 'deleted'>;

/**
 * Shared address-book records the journey helpers pick by name (Astra Rosales,
 * Tech Imports Ltd, … plus pagination/search fodder).
 *
 * Seeded once through the address-book API in Playwright `globalSetup` — not
 * per worker — so parallel runs cannot create duplicate names. Address-feature
 * specs that do not need these names inject their own unique records in-test.
 *
 * Order is creation order when the book is empty: later rows are newer and land
 * on earlier picker pages (newest first). Journey parties are created last.
 */
export const E2E_ADDRESS_BOOK_FIXTURES: readonly AddressBookCreate[] = [
  // Page-three / pagination fodder (created first → oldest)
  {
    name: 'Alpine Dairy GmbH',
    addressLine1: 'Bahnhofstrasse 17',
    townOrCity: 'Innsbruck',
    postcode: '6020',
    countryCode: 'AT',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },
  {
    name: 'Irish Beef Traders Ltd',
    addressLine1: 'Castle Road 9',
    townOrCity: 'Kilkenny',
    postcode: 'R95 F2X8',
    countryCode: 'IE',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },
  {
    name: 'Iberian Swine SA',
    addressLine1: 'Calle Mayor 44',
    townOrCity: 'Huesca',
    postcode: '22001',
    countryCode: 'ES',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },

  // Page-two fodder
  {
    name: 'Animal and Plant Health Agency',
    addressLine1: 'Woodham Lane',
    townOrCity: 'Addlestone',
    postcode: 'KT15 3NB',
    countryCode: 'United Kingdom',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },
  {
    name: 'Danish Meat Export ApS',
    addressLine1: 'Havnegade 21',
    townOrCity: 'Copenhagen',
    postcode: '1058',
    countryCode: 'DK',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },
  {
    name: 'Jutland Swine ApS',
    addressLine1: 'Sondergade 4',
    townOrCity: 'Aarhus',
    postcode: '8000',
    countryCode: 'DK',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },
  {
    name: 'Laiterie du Nord SARL',
    addressLine1: '12 Rue de la Gare',
    townOrCity: 'Lille',
    postcode: '59000',
    countryCode: 'FR',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },
  {
    name: 'Nordvik Seafood AS',
    addressLine1: 'Havnegata 8',
    townOrCity: 'Alesund',
    postcode: '6002',
    countryCode: 'NO',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },

  // Journey parties (created last → newest → page one on a fresh book)
  {
    name: 'Astra Rosales',
    addressLine1: '43 East Hague Extension',
    townOrCity: 'Bern',
    postcode: '30055',
    countryCode: 'CH',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },
  {
    name: 'Tech Imports Ltd',
    addressLine1: '18 Dockside Road',
    townOrCity: 'London',
    postcode: 'E14 9GE',
    countryCode: 'United Kingdom',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },
  {
    name: 'Origin Farm',
    addressLine1: '1 Farm Lane',
    townOrCity: 'Ennis',
    postcode: 'V95 X7P2',
    countryCode: 'IE',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },
  {
    name: 'British Livestock Ltd',
    addressLine1: '10 Market Street',
    townOrCity: 'Leeds',
    postcode: 'LS1 6HB',
    countryCode: 'United Kingdom',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },
  {
    name: 'Import Co UK',
    addressLine1: '20 Trade Road',
    townOrCity: 'London',
    postcode: 'EC1A 1BB',
    countryCode: 'United Kingdom',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
  },
];

/**
 * Ensures exactly one live record per journey fixture name.
 * Creates when missing; soft-deletes extras left over from an earlier race.
 */
export async function ensureE2eAddressBook(api: AddressBookApiClient): Promise<void> {
  for (const record of E2E_ADDRESS_BOOK_FIXTURES) {
    const matches = (await api.listAddresses(record.name)).filter((item) => item.name === record.name);
    if (matches.length === 0) {
      await api.createAddress(record);
      continue;
    }
    for (const extra of matches.slice(1)) {
      await api.deleteAddress(extra.id);
    }
  }
}

import type { AddressBookApiClient, AddressBookEntry, AddressBookRecord } from '@adapters/http/address-book-api-client';
import { addressTypes, addressUses } from '@domain/shared/constants/address-types';

const heldAsConsignor = { addressType: addressTypes.originOrConsignor, uses: [addressUses.consignor] };
const heldAsPlaceOfOrigin = { addressType: addressTypes.originOrConsignor, uses: [addressUses.placeOfOrigin] };
const heldAsPlaceOfDestination = {
  addressType: addressTypes.destinationConsigneeOrImporter,
  uses: [addressUses.placeOfDestination],
};
const heldAsConsignee = { addressType: addressTypes.destinationConsigneeOrImporter, uses: [addressUses.consignee] };
const heldAsImporter = { addressType: addressTypes.destinationConsigneeOrImporter, uses: [addressUses.importer] };
const heldAsBranchAddress = { addressType: addressTypes.branch, uses: [addressUses.branchAddress] };

/** The shared address-book records, in creation order. */
export const E2E_ADDRESS_BOOK_FIXTURES: readonly AddressBookEntry[] = [
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
    name: 'Animal and Plant Health Agency',
    addressLine1: 'Woodham Lane',
    townOrCity: 'Addlestone',
    postcode: 'KT15 3NB',
    countryCode: 'GB',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsBranchAddress,
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
  {
    name: 'Laiterie du Nord SARL',
    addressLine1: '12 Rue de la Gare',
    townOrCity: 'Lille',
    postcode: '59000',
    countryCode: 'FR',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsConsignor,
  },
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
  {
    name: 'Astra Rosales',
    addressLine1: '43 East Hague Extension',
    townOrCity: 'Bern',
    postcode: '30055',
    countryCode: 'CH',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsConsignor,
  },
  {
    name: 'Tech Imports Ltd',
    addressLine1: '18 Dockside Road',
    townOrCity: 'London',
    postcode: 'E14 9GE',
    countryCode: 'GB',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsPlaceOfDestination,
  },
  {
    name: 'Origin Farm',
    addressLine1: '1 Farm Lane',
    townOrCity: 'Ennis',
    postcode: 'V95 X7P2',
    countryCode: 'IE',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsPlaceOfOrigin,
  },
  {
    name: 'British Livestock Ltd',
    addressLine1: '10 Market Street',
    townOrCity: 'Leeds',
    postcode: 'LS1 6HB',
    countryCode: 'GB',
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    ...heldAsConsignee,
  },
  {
    name: 'Import Co UK',
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

const differsFrom = (live: AddressBookRecord, wanted: AddressBookEntry): boolean =>
  (Object.keys(wanted) as Array<keyof AddressBookEntry>).some((field) => !sameValue(live[field], wanted[field]));

/**
 * Ensures one live record per journey fixture name, holding the fixture's details, type and uses.
 * Creates a missing record, rewrites one that differs and soft-deletes any extra with the name.
 */
export async function ensureE2eAddressBook(api: AddressBookApiClient): Promise<void> {
  for (const record of E2E_ADDRESS_BOOK_FIXTURES) {
    const matches = (await api.listAddresses(record.name)).filter((item) => item.name === record.name);
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

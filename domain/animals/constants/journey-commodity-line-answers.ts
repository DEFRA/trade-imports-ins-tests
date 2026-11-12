import { commodityLines, type CommodityLine } from '@domain/animals/constants/commodity-lines';

/** One commodity line on the notification — species, counts and the identifiers that species needs. */
export type CommodityLineAnswer = {
  species: CommodityLine;
  noOfAnimals: number;
  noOfPackages?: number;
  earTag?: string;
  passportNumber?: string;
  microchip?: string;
  tattoo?: string;
  permanentAddress?: PermanentAddressAnswer;
};

export type NewPermanentAddressFields = {
  nameOrOrganisationName: string;
  addressLine1: string;
  townOrCity: string;
  postcode: string;
  phone: string;
  email: string;
  addressLine2?: string;
  county?: string;
};

/** Each animal that needs one answers the permanent address page with either option. */
export type PermanentAddressAnswer = { origin: 'placeOfDestination' } | ({ origin: 'newAddress' } & NewPermanentAddressFields);

/** One animal per line, answering only what the frontend requires of that species. */
export const MANDATORY_COMMODITY_LINES = {
  cattle: {
    species: commodityLines.cattle,
    noOfAnimals: 1,
    earTag: 'UK123456789012',
  },
  domesticCat: {
    species: commodityLines.domesticCat,
    noOfAnimals: 1,
    passportNumber: 'UK123456789',
    permanentAddress: {
      origin: 'newAddress',
      nameOrOrganisationName: 'Pet Owner',
      addressLine1: '1 Farm Lane',
      townOrCity: 'Skipton',
      postcode: 'BD23 1UD',
      phone: '+44 1756 555 0192',
      email: 'owner@example.co.uk',
    },
  },
  donkey: {
    species: commodityLines.donkey,
    noOfAnimals: 1,
    passportNumber: 'UK987654321',
  },
  horse: {
    species: commodityLines.horse,
    noOfAnimals: 1,
    passportNumber: 'UK135792468',
  },
} satisfies Record<string, CommodityLineAnswer>;

/** One animal per line, answering every field the frontend offers that species. */
export const ALL_COMMODITY_LINES = {
  cattle: {
    ...MANDATORY_COMMODITY_LINES.cattle,
    noOfPackages: 5,
    passportNumber: 'PASSPORT-0001',
  },
  domesticCat: {
    ...MANDATORY_COMMODITY_LINES.domesticCat,
    noOfPackages: 1,
    microchip: '900987654321098',
    tattoo: 'AB1234',
    permanentAddress: {
      ...MANDATORY_COMMODITY_LINES.domesticCat.permanentAddress,
      addressLine2: 'Low Moor',
      county: 'North Yorkshire',
    },
  },
} satisfies Record<string, CommodityLineAnswer>;

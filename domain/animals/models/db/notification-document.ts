import type { ObjectId } from 'mongodb';

type StoredAddress = {
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  countryCode: string;
};

/**
 * Held either as an `addressId` reference resolved on read, or with the details
 * inline and no `addressId`, so every field is optional.
 */
type StoredParty = {
  addressId?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: StoredAddress;
};

/**
 * One animal-identifier unit on a species line — every unit, not just the
 * first.
 */
type StoredAnimalIdentifier = {
  microchip?: string;
  passport?: string;
  tattoo?: string;
  earTag?: string;
  horseName?: string;
  permanentAddress?: StoredParty;
};

type NotificationContent = {
  origin: {
    countryCode: string;
    requiresRegionCode: string;
    regionOfOriginCode?: string;
    internalReference?: string;
  };
  commodity: {
    name: string;
    commodityComplement: Array<{
      typeOfCommodity: string;
      species: Array<{
        value: string;
        text: string;
        noOfAnimals: number;
        noOfPackages: number;
        earTag: string;
        passport: string;
        microchip?: string;
        animalIdentifiers?: StoredAnimalIdentifier[];
      }>;
      totalNoOfAnimals: number;
      totalNoOfPackages: number;
    }>;
  };
  reasonForImport: string;
  additionalDetails: {
    certifiedFor?: string;
    unweanedAnimals: string;
  };
  placeOfOrigin?: StoredParty;
  consignor?: StoredParty;
  consignee?: StoredParty;
  importer?: StoredParty;
  destination?: StoredParty;
  cphNumber?: string;
  transport: {
    portOfEntry?: string;
    arrivalDate?: Date;
    meansOfTransport: string;
    transportIdentification?: string;
    transportDocumentReference?: string;
    transitedCountries?: string[];
    transporter?: {
      name: string;
      address: Partial<StoredAddress>;
      approvalNumber: string;
      type: string;
    };
  };
  consignment?: StoredParty;
  purposeInInternalMarket?: string;
  destinationCountry?: string;
  portOfExit?: string;
  exitDate?: Date;
};

export type NotificationDocument = {
  _id: ObjectId;
  referenceNumber: string | null;
  notification: NotificationContent;
  fulfilments?: unknown[];
  /** Pre-amend snapshot of notification content. Present only during an in-flight amendment. */
  preAmendNotification?: NotificationContent;
  status: string;
  created: Date;
  updated: Date;
  _class: string;
};

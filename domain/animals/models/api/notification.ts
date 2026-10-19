import type { PersistedFulfilmentEntry } from '@domain/animals/models/api/notification-fulfilments';

export const notificationStatuses = {
  draft: 'DRAFT',
  submitted: 'SUBMITTED',
  amend: 'AMEND',
  deleted: 'DELETED',
} as const;

export type NotificationStatus = (typeof notificationStatuses)[keyof typeof notificationStatuses];

/** A Standard Address Block on the wire. */
export type PartyAddress = {
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  countryCode: string;
};

/** A party on a notification: a copy of the address-book record picked for the role, with no link back to it. */
export type ConsignmentParty = {
  name?: string;
  email?: string;
  phone?: string;
  address?: PartyAddress;
};

export type Transporter = {
  name: string;
  address: PartyAddress;
  approvalNumber: string;
  type: string;
};

/** One animal-identifier unit on a species line. */
export type AnimalIdentifier = {
  microchip?: string;
  passport?: string;
  tattoo?: string;
  earTag?: string;
  horseName?: string;
  permanentAddress?: ConsignmentParty;
};

/**
 * Counts are sent as strings and read back as numbers. `earTag`, `passport`
 * and `microchip` hold the line's first animal-identifier unit;
 * `animalIdentifiers` holds every unit.
 */
export type SpeciesEntry = {
  value: string;
  text: string;
  noOfAnimals?: number | string;
  noOfPackages?: number | string;
  earTag?: string;
  passport?: string;
  microchip?: string;
  animalIdentifiers?: AnimalIdentifier[];
};

export type CommodityComplement = {
  typeOfCommodity: string;
  species: SpeciesEntry[];
  totalNoOfAnimals?: number;
  totalNoOfPackages?: number;
};

export type Commodity = {
  name: string;
  commodityComplement?: CommodityComplement[];
};

export type Origin = {
  countryCode?: string;
  requiresRegionCode?: string;
  regionOfOriginCode?: string;
  internalReference?: string;
};

export type AdditionalDetails = {
  certifiedFor?: string;
  unweanedAnimals?: string;
};

export type Transport = {
  portOfEntry?: string;
  arrivalDate?: string;
  meansOfTransport?: string;
  transportIdentification?: string;
  transportDocumentReference?: string;
  transitedCountries?: string[];
  transporter?: Transporter;
};

/** Wire shape of the /notifications API. A section a draft has not reached is null. */
export type Notification = {
  referenceNumber?: string;
  origin?: Origin | null;
  commodity?: Commodity | null;
  reasonForImport?: string | null;
  additionalDetails?: AdditionalDetails | null;
  placeOfOrigin?: ConsignmentParty | null;
  consignor?: ConsignmentParty | null;
  consignee?: ConsignmentParty | null;
  importer?: ConsignmentParty | null;
  destination?: ConsignmentParty | null;
  consignment?: ConsignmentParty | null;
  cphNumber?: string | null;
  transport?: Transport | null;
  purposeInInternalMarket?: string | null;
  destinationCountry?: string | null;
  portOfExit?: string | null;
  exitDate?: string | null;
  status?: NotificationStatus;
  created?: string;
  updated?: string;
  submittedAt?: string | null;
  fulfilments?: PersistedFulfilmentEntry[];
  concurrencyToken?: number;
};

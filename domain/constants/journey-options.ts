import { type CommodityCode, commodityCodes } from '@domain/constants/commodity-codes';
import { commoditySpecies, type CommoditySpecies } from '@domain/constants/commodity-species';
import { type CommodityType, commodityTypes } from '@domain/constants/commodity-types';
import { type CountryCode, countryCodes } from '@domain/constants/country-codes';
import { type ImportReason, importReasons } from '@domain/constants/import-reasons';
import { type CertificationPurpose, certificationPurposes } from '@domain/constants/certification-purposes';
import type { YesNoValue } from '@domain/constants/yes-no-values';
import { pointOfEntries, type PointOfEntry } from '@domain/constants/point-of-entries';
import { meansOfTransport, type MeansOfTransport } from '@domain/constants/means-of-transport';
import type { AccompanyingDocument } from '@domain/types/accompanying-document';
import type { DateInput } from '@domain/types/date-time-input';
import { getRelativeDateInput } from '@utils/date-utils';

/**
 * The options schema and default test-notification content shared by every
 * way of driving a notification to a given state — the UI wizard (`Journey`)
 * and the frontend seeder (`SeededJourney`) both build from these, so there
 * is one source of truth for what a "default" test notification looks like.
 */
export type JourneyOptions = {
  countryCode?: CountryCode;
  requiresRegionCode?: YesNoValue;
  internalReference?: string;
  commodityCode?: CommodityCode;
  commodityType?: CommodityType;
  species?: CommoditySpecies | CommoditySpecies[];
  importReason?: ImportReason;
  noOfAnimals?: number | number[];
  noOfPackages?: number | number[];
  certificationPurpose?: CertificationPurpose;
  unweanedAnimals?: YesNoValue;
  accompanyingDocuments?: AccompanyingDocument | AccompanyingDocument[];
  pointOfEntry?: PointOfEntry;
  arrivalDate?: DateInput;
  meansOfTransport?: MeansOfTransport;
  transportIdentification?: string;
  transportDocumentReference?: string;
  transitedCountries?: CountryCode | CountryCode[];
};

export const defaultJourneyOptions: Required<JourneyOptions> = {
  countryCode: countryCodes.eu.france,
  requiresRegionCode: undefined,
  internalReference: undefined,
  commodityCode: commodityCodes.dog,
  commodityType: commodityTypes.domestic,
  species: [commoditySpecies.bisonBison, commoditySpecies.bosSpp],
  importReason: importReasons.internalMarket,
  noOfAnimals: [5, 19],
  noOfPackages: [13, 21],
  certificationPurpose: certificationPurposes.approvedBodies,
  unweanedAnimals: undefined,
  accompanyingDocuments: undefined,
  pointOfEntry: pointOfEntries.aberdeen,
  arrivalDate: getRelativeDateInput({ dayOffset: 14 }),
  meansOfTransport: meansOfTransport.vessel,
  transportIdentification: undefined,
  transportDocumentReference: undefined,
  transitedCountries: undefined,
};

export const EAR_TAG_PREFIX = 'FR';
export const PASSPORT_PREFIX = 'FR-BOV-2024-';
export const PLACE_OF_ORIGIN_NAME = 'Origin Farm';
export const CONSIGNOR_NAME = 'Astra Rosales';
export const CONSIGNEE_NAME = 'British Livestock Ltd';
export const IMPORTER_NAME = 'Import Co UK';
export const DESTINATION_NAME = 'Tech Imports Ltd';
export const CPH_NUMBER = '123456789';
export const TRANSPORTER_NAME = 'García Livestock Transport SL';
export const CONTACT_ADDRESS_NAME = 'Animal and Plant Health Agency';

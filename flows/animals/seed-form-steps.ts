import type { FormFields } from '@adapters/http/frontend-form-client';
import { assertConsistentAnswers, type NotificationAnswers } from '@domain/animals/constants/journey-options';
import { speciesCheckboxValue } from '@domain/animals/constants/commodity-lines';

export type PartyRole = 'placeOfOrigin' | 'consignor' | 'consignee' | 'importer' | 'placeOfDestination' | 'contact';

/** The address-book records the answers name; each name must match a record seeded by `address-book-seed.ts`. */
export type PartyNames = Record<PartyRole, string>;

export type PartyIds = Record<PartyRole, string>;

export const partyNamesFrom = (answers: NotificationAnswers): PartyNames => ({
  ...answers.parties,
  contact: answers.contactAddress,
});

export type SeedStep = {
  slug: string;
  form: FormFields;
  returnsHtml?: boolean;
};

/**
 * How far a seeded draft is answered. `unlocked` answers origin and commodity, which opens the other tasks;
 * `partial` goes on through arrival; `ready` answers every section, so the draft can be declared.
 */
export type DraftStage = 'unlocked' | 'partial' | 'ready';

const FIRST_LINE_INDEX = 0;

const originStep = (answers: NotificationAnswers): SeedStep => ({
  slug: 'origin',
  form: {
    countryOfOrigin: answers.countryCode.value,
    regionOfOriginCodeRequirement: answers.requiresRegionCode.toLowerCase(),
    regionOfOriginCodeSuffix: answers.regionCode ?? '',
    ...(answers.internalReference && { internalReferenceNumber: answers.internalReference }),
  },
});

const commoditySteps = (answers: NotificationAnswers): SeedStep[] => [
  { slug: 'commodities', form: { commoditySearch: answers.species.searchTerm, action: 'search' }, returnsHtml: true },
  { slug: 'commodities', form: { species: speciesCheckboxValue(answers.species) } },
  {
    slug: 'consignment-details',
    form: {
      [`numberOfAnimalsQuantity-${FIRST_LINE_INDEX}`]: String(answers.noOfAnimals),
      ...(answers.noOfPackages !== undefined && { [`numberOfPackages-${FIRST_LINE_INDEX}`]: String(answers.noOfPackages) }),
    },
  },
  {
    slug: 'commodities/identification',
    form: {
      [`animalIdentifierEarTag-${FIRST_LINE_INDEX}`]: answers.earTag,
      ...(answers.passportNumber && { [`animalIdentifierPassport-${FIRST_LINE_INDEX}`]: answers.passportNumber }),
    },
  },
];

const consignmentSteps = (answers: NotificationAnswers): SeedStep[] => [
  {
    slug: 'import-reason',
    form: { reasonForImport: answers.importReason.value, purposeInInternalMarket: answers.internalMarketPurpose.value },
  },
  {
    slug: 'additional-details',
    form: { animalsCertifiedFor: answers.certifiedFor.value, containsUnweanedAnimals: answers.unweanedAnimals.toLowerCase() },
  },
];

const addressSteps = (parties: PartyIds, answers: NotificationAnswers): SeedStep[] => [
  { slug: 'consignors/select', form: { party: parties.consignor } },
  { slug: 'destinations/select', form: { party: parties.placeOfDestination } },
  { slug: 'place-of-origin/select', form: { party: parties.placeOfOrigin } },
  { slug: 'consignees/select', form: { party: parties.consignee } },
  { slug: 'importers/select', form: { party: parties.importer } },
  { slug: 'addresses', form: {} },
  {
    slug: 'cph-number',
    form: { cphCounty: answers.cph.county, cphParish: answers.cph.parish, cphHolding: answers.cph.holding },
  },
];

const arrivalStep = (answers: NotificationAnswers): SeedStep => ({
  slug: 'port-of-entry',
  form: {
    arrivalDateAtPort: answers.arrivalDate,
    portOfEntry: answers.pointOfEntry.value,
    meansOfTransport: answers.meansOfTransport.value,
    transportIdentification: answers.transportIdentification,
    transportDocumentReference: answers.transportDocumentReference,
  },
});

const transportSteps = (answers: NotificationAnswers): SeedStep[] => [
  ...(answers.transitedCountries
    ? [{ slug: 'transit-countries', form: { transitedCountries: answers.transitedCountries.map(({ value }) => value) } }]
    : []),
  { slug: 'transporters', form: { transporter: answers.transporter.value } },
];

const contactStep = (parties: PartyIds): SeedStep => ({
  slug: 'consignment/contact/select',
  form: { contactAddress: parties.contact },
});

export const seedSteps = async (
  resolveParties: (names: PartyNames) => Promise<PartyIds>,
  stage: DraftStage,
  answers: NotificationAnswers,
): Promise<SeedStep[]> => {
  assertConsistentAnswers(answers);
  if (answers.accompanyingDocument) {
    throw new Error('The seeded journey cannot upload an accompanying document: the form client sends no files.');
  }
  const unlocked = [originStep(answers), ...commoditySteps(answers)];
  if (stage === 'unlocked') {
    return unlocked;
  }
  const parties = await resolveParties(partyNamesFrom(answers));
  const throughArrival = [...unlocked, ...consignmentSteps(answers), ...addressSteps(parties, answers), arrivalStep(answers)];
  return stage === 'partial' ? throughArrival : [...throughArrival, ...transportSteps(answers), contactStep(parties)];
};

export const declarationStep: { reviewSlug: string; slug: string; review: FormFields; declare: FormFields } = {
  reviewSlug: 'notification-view',
  slug: 'declaration',
  review: { step: 'review' },
  declare: { step: 'declare', declaration: 'confirmed' },
};

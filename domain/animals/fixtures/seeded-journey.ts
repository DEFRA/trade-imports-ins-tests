import type { FormFields } from '@adapters/http/frontend-form-client';
import { MANDATORY_ANSWERS, type NotificationAnswers } from '@domain/animals/constants/journey-options';

// Each fact comes from the shared answers; this file only translates it into the form field the frontend takes.
// `api-seed-parity.spec.ts` compares what the seed stores with what the browser journey stores.

/** Names must match the records seeded by `e2e-address-book.ts`. */
export const PARTY_NAMES = {
  placeOfOrigin: MANDATORY_ANSWERS.parties.placeOfOrigin,
  consignor: MANDATORY_ANSWERS.parties.consignor,
  consignee: MANDATORY_ANSWERS.parties.consignee,
  importer: MANDATORY_ANSWERS.parties.importer,
  placeOfDestination: MANDATORY_ANSWERS.parties.placeOfDestination,
  contact: MANDATORY_ANSWERS.contactAddress,
} as const;

export type PartyRole = keyof typeof PARTY_NAMES;

export type PartyIds = Record<PartyRole, string>;

export type SeedStep = {
  slug: string;
  form: FormFields;
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
    // The country prefix is filled in for the trader, so the box takes only what follows it.
    regionOfOriginCodeSuffix: answers.regionCode ?? '',
    ...(answers.internalReference && { internalReferenceNumber: answers.internalReference }),
  },
});

const commoditySteps = (answers: NotificationAnswers): SeedStep[] => [
  { slug: 'commodities', form: { species: answers.species.value } },
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
  // The empty hub post is what advances past the pickers; without it the seed stalls.
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
  // Countries are added one at a time and saved in the order they were added,
  // so the seed matches the order the browser journey adds them.
  ...(answers.transitedCountries
    ? [{ slug: 'transit-countries', form: { transitedCountries: answers.transitedCountries.map(({ value }) => value) } }]
    : []),
  // The list carries both kinds, so the pick settles the transporter type too
  // and there is no separate type post.
  { slug: 'transporters', form: { transporter: answers.transporter.value } },
];

const contactStep = (parties: PartyIds): SeedStep => ({
  slug: 'consignment/contact/select',
  form: { contactAddress: parties.contact },
});

export const seedSteps = async (
  resolveParties: () => Promise<PartyIds>,
  stage: DraftStage,
  answers: NotificationAnswers,
): Promise<SeedStep[]> => {
  if (answers.accompanyingDocument) {
    throw new Error('The seeded journey cannot upload an accompanying document: the form client sends no files.');
  }
  const unlocked = [originStep(answers), ...commoditySteps(answers)];
  if (stage === 'unlocked') {
    return unlocked;
  }
  const parties = await resolveParties();
  const throughArrival = [...unlocked, ...consignmentSteps(answers), ...addressSteps(parties, answers), arrivalStep(answers)];
  return stage === 'partial' ? throughArrival : [...throughArrival, ...transportSteps(answers), contactStep(parties)];
};

export const declarationStep: { reviewSlug: string; slug: string; review: FormFields; declare: FormFields } = {
  reviewSlug: 'notification-view',
  slug: 'declaration',
  review: { step: 'review' },
  declare: { step: 'declare', declaration: 'confirmed' },
};

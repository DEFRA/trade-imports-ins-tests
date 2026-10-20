import type { FormFields } from '@adapters/http/frontend-form-client';
import { getRelativeAppDateText } from '@utils/date-utils';
import { commodityLines, selectionKey } from '@domain/animals/constants/commodity-lines';

// Answers must stay in step with `flows/animals/journey.ts`; `api-seed-parity.spec.ts` compares the two.

/** Names must match the records seeded by `e2e-address-book.ts`. */
export const PARTY_NAMES = {
  placeOfOrigin: 'Origin Farm',
  consignor: 'Astra Rosales',
  consignee: 'British Livestock Ltd',
  importer: 'Import Co UK',
  placeOfDestination: 'Tech Imports Ltd',
  contact: 'Animal and Plant Health Agency',
} as const;

export type PartyRole = keyof typeof PARTY_NAMES;

export type PartyIds = Record<PartyRole, string>;

export type SeedStep = {
  slug: string;
  form: FormFields;
  /** The post answers with the page itself rather than redirecting to the next one. */
  rendersPage?: boolean;
};

export type SeedDepth = 'unlocked' | 'draft' | 'readyToSubmit';

const FIRST_LINE_INDEX = 0;

const MONTHS_AHEAD_INSIDE_ARRIVAL_WINDOW = 1;

const originStep: SeedStep = {
  slug: 'origin',
  form: {
    countryOfOrigin: 'FR',
    regionOfOriginCodeRequirement: 'yes',
    // The country prefix is filled in for the trader, so the box takes only what follows it.
    regionOfOriginCodeSuffix: '75',
    internalReferenceNumber: 'Imports456GB',
  },
};

const commoditySteps: SeedStep[] = [
  // The picker saves only a species its search showed, so the search goes first.
  { slug: 'commodities', form: { commoditySearch: commodityLines.cattle.searchTerm, action: 'search' }, rendersPage: true },
  { slug: 'commodities', form: { species: selectionKey(commodityLines.cattle) } },
  {
    slug: 'consignment-details',
    form: { [`numberOfAnimalsQuantity-${FIRST_LINE_INDEX}`]: '1', [`numberOfPackages-${FIRST_LINE_INDEX}`]: '5' },
  },
  { slug: 'commodities/identification', form: { [`animalIdentifierEarTag-${FIRST_LINE_INDEX}`]: 'UK123456789012' } },
];

const consignmentSteps: SeedStep[] = [
  { slug: 'import-reason', form: { reasonForImport: 'internalMarket', purposeInInternalMarket: 'breeding' } },
  { slug: 'additional-details', form: { animalsCertifiedFor: 'slaughter', containsUnweanedAnimals: 'no' } },
];

const addressSteps = (parties: PartyIds): SeedStep[] => [
  { slug: 'consignors/select', form: { party: parties.consignor } },
  { slug: 'destinations/select', form: { party: parties.placeOfDestination } },
  { slug: 'place-of-origin/select', form: { party: parties.placeOfOrigin } },
  { slug: 'consignees/select', form: { party: parties.consignee } },
  { slug: 'importers/select', form: { party: parties.importer } },
  // The empty hub post is what advances past the pickers; without it the seed stalls.
  { slug: 'addresses', form: {} },
  { slug: 'cph-number', form: { cphCounty: '12', cphParish: '345', cphHolding: '6789' } },
];

const arrivalStep: SeedStep = {
  slug: 'port-of-entry',
  form: {
    arrivalDateAtPort: getRelativeAppDateText({ monthOffset: MONTHS_AHEAD_INSIDE_ARRIVAL_WINDOW }),
    portOfEntry: 'GB ABD',
    meansOfTransport: 'ROAD_VEHICLE',
    transportIdentification: 'FR-892-LK',
    transportDocumentReference: 'CMR-2026-884721',
  },
};

// Only in scope because arrivalStep posts ROAD_VEHICLE — transitedCountries applies to land transport only.
const transportSteps: SeedStep[] = [
  // Countries are added one at a time and saved in the order they were added,
  // so the seed matches the order the browser journey adds them: France, then Belgium.
  { slug: 'transit-countries', form: { transitedCountries: ['FR', 'BE'] } },
  // The list carries both kinds, so the pick settles the transporter type too
  // and there is no separate type post.
  { slug: 'transporters', form: { transporter: 'garcia-livestock-transport' } },
];

const contactStep = (parties: PartyIds): SeedStep => ({
  slug: 'consignment/contact/select',
  form: { contactAddress: parties.contact },
});

export const seedSteps = async (resolveParties: () => Promise<PartyIds>, depth: SeedDepth): Promise<SeedStep[]> => {
  const unlocked = [originStep, ...commoditySteps];
  if (depth === 'unlocked') {
    return unlocked;
  }
  const parties = await resolveParties();
  const throughArrival = [...unlocked, ...consignmentSteps, ...addressSteps(parties), arrivalStep];
  return depth === 'draft' ? throughArrival : [...throughArrival, ...transportSteps, contactStep(parties)];
};

export const declarationStep: { reviewSlug: string; slug: string; review: FormFields; declare: FormFields } = {
  reviewSlug: 'notification-view',
  slug: 'declaration',
  review: { step: 'review' },
  declare: { step: 'declare', declaration: 'confirmed' },
};

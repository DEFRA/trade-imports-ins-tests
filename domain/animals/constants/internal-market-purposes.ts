export const internalMarketPurposes = {
  breeding: { value: 'breeding', display: 'Breeding' },
  companionAnimalNotForResaleOrRehoming: {
    value: 'companion-animal-not-for-resale-or-rehoming',
    display: 'Companion animal not for resale or rehoming',
  },
} as const;

export type InternalMarketPurpose = (typeof internalMarketPurposes)[keyof typeof internalMarketPurposes];

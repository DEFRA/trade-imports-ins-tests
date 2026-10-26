export const internalMarketPurposes = {
  breeding: { value: 'breeding', display: 'Breeding' },
} as const;

export type InternalMarketPurpose = (typeof internalMarketPurposes)[keyof typeof internalMarketPurposes];

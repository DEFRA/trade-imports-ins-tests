export const commodityCodes = {
  // Temporary AC behavior: currently uses animal names; update when commodity codes are implemented.
  cow: 'Cow',
  cat: 'Cat',
  dog: 'Dog',
  fish: 'Fish',
} as const;

export type CommodityCode = (typeof commodityCodes)[keyof typeof commodityCodes];

// The value is the commodity picker's checkbox value, commodity|speciesId.
export const commoditySpecies = {
  bosTaurus: { value: 'Cow|1148346', display: 'Bos taurus' },
} as const;

export type CommoditySpecies = (typeof commoditySpecies)[keyof typeof commoditySpecies];

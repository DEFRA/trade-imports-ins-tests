export const commodityTypes = {
  domestic: 'Domestic',
} as const;

export type CommodityType = (typeof commodityTypes)[keyof typeof commodityTypes];

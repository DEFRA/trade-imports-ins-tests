import { commodityLines, type CommodityLine } from '@domain/animals/constants/commodity-lines';

export type CommoditySpecies = CommodityLine;

/** Alias for commodity catalogue entries used in page specs and journey helpers. */
export const commoditySpecies = commodityLines;

export const commoditySpecies = {
  bisonBison: 'Bison bison',
  bosSpp: 'Bos spp.',
  bosTaurus: 'Bos taurus',
  bubalusBubalis: 'Bubalus bubalis',
} as const;

export type CommoditySpecies = (typeof commoditySpecies)[keyof typeof commoditySpecies];

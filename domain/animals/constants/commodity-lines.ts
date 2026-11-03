export type CommodityLine = {
  searchTerm: string;
  commodityCode: string;
  commodityName: string;
  latinName: string;
};

export const commodityLines = {
  cattle: { searchTerm: 'Bos taurus', commodityCode: '0102', commodityName: 'Live bovine animals', latinName: 'Bos taurus' },
  bison: { searchTerm: 'Bison bison', commodityCode: '0102', commodityName: 'Live bovine animals', latinName: 'Bison bison' },
  horse: {
    searchTerm: 'horse',
    commodityCode: '0101',
    commodityName: 'Live horses, asses, mules and hinnies',
    latinName: 'Equus cabalus',
  },
  domesticCat: { searchTerm: 'domestic cat', commodityCode: '01061900', commodityName: 'Other', latinName: 'Felis catus' },
  raccoonDog: {
    searchTerm: 'dog',
    commodityCode: '01061900',
    commodityName: 'Other',
    latinName: 'Nyctereutes procyonoides',
  },
  ostrich: {
    searchTerm: 'ostrich',
    commodityCode: '01063300',
    commodityName: 'Ostriches; emus (Dromaius novaehollandiae)',
    latinName: 'Struthio spp.',
  },
} as const satisfies Record<string, CommodityLine>;

export const commodityNameOf = (line: CommodityLine): string => line.commodityName;

export const speciesCheckboxValue = (line: CommodityLine): string => `${line.commodityCode}|${line.latinName}`;

export const speciesCardTitle = (line: CommodityLine): string => `${line.commodityCode} — ${line.latinName}`;

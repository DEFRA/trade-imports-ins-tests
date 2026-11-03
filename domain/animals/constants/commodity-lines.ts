export type CommodityLine = {
  searchTerm: string;
  commodityCode: string;
  latinName: string;
};

export const commodityLines = {
  cattle: { searchTerm: 'Bos taurus', commodityCode: '0102', latinName: 'Bos taurus' },
  bison: { searchTerm: 'Bison bison', commodityCode: '0102', latinName: 'Bison bison' },
  horse: { searchTerm: 'horse', commodityCode: '0101', latinName: 'Equus cabalus' },
  domesticCat: { searchTerm: 'domestic cat', commodityCode: '01061900', latinName: 'Felis catus' },
  raccoonDog: { searchTerm: 'dog', commodityCode: '01061900', latinName: 'Nyctereutes procyonoides' },
  ostrich: { searchTerm: 'ostrich', commodityCode: '01063300', latinName: 'Struthio spp.' },
} as const satisfies Record<string, CommodityLine>;

const commodityNamesByCode: Record<string, string> = {
  '0102': 'Live bovine animals',
};

export const commodityNameOf = (line: CommodityLine): string => {
  const name = commodityNamesByCode[line.commodityCode];
  if (!name) throw new Error(`No commodity name is known for code ${line.commodityCode}`);
  return name;
};

export const speciesCheckboxValue = (line: CommodityLine): string => `${line.commodityCode}|${line.latinName}`;

export const speciesCardTitle = (line: CommodityLine): string => `${line.commodityCode} — ${line.latinName}`;

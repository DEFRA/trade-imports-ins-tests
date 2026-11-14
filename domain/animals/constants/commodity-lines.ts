export type SpeciesNamePair = {
  latinName: string;
  commonName: string | null;
};

export type CommodityLine = SpeciesNamePair & {
  searchTerm: string;
  commodityCode: string;
};

export const commodityLines = {
  cattle: { searchTerm: 'Bos taurus', commodityCode: '0102', latinName: 'Bos taurus', commonName: 'Domestic Cattle' },
  bison: { searchTerm: 'Bison bison', commodityCode: '0102', latinName: 'Bison bison', commonName: 'American Bison' },
  horse: { searchTerm: 'horse', commodityCode: '0101', latinName: 'Equus cabalus', commonName: 'Horse' },
  donkey: { searchTerm: 'donkey', commodityCode: '0101', latinName: 'Equus asinus', commonName: 'Donkey' },
  domesticCat: { searchTerm: 'domestic cat', commodityCode: '01061900', latinName: 'Felis catus', commonName: 'Domestic Cat' },
  raccoonDog: { searchTerm: 'dog', commodityCode: '01061900', latinName: 'Nyctereutes procyonoides', commonName: 'Raccoon Dog' },
  ostrich: { searchTerm: 'ostrich', commodityCode: '01063300', latinName: 'Struthio spp.', commonName: 'Ostriches' },
  chicken: { searchTerm: '010', commodityCode: '01051111', latinName: 'Gallus gallus', commonName: 'Chicken' },
} as const satisfies Record<string, CommodityLine>;

export const speciesCheckboxValue = (line: CommodityLine): string => `${line.commodityCode}|${line.latinName}`;

export const commodityCardTitle = (line: CommodityLine): string => line.commodityCode;

const capitalised = (word: string): string => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;

export const speciesBlockHeading = (line: CommodityLine): string => line.latinName.split(' ').map(capitalised).join(' ');

export const speciesLabel = (species: SpeciesNamePair): string =>
  species.commonName ? `${species.latinName} (${species.commonName})` : species.latinName;

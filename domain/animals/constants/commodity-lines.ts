/**
 * One species under one CN code, as the commodity picker offers it: a tick box
 * labelled with the Latin name, under a heading of the code. The same Latin name
 * can sit under several codes (Bos taurus is under four), so a line needs both.
 *
 * The stack's stub answers only the searches saved from MDM, so `searchTerm` is
 * a saved term whose first page of results lists this line.
 */
export type CommodityLine = {
  searchTerm: string;
  code: string;
  latinName: string;
};

export const commodityLines = {
  // Ear tag and passport; asked for CPH and unweaned animals.
  cattle: { searchTerm: 'Bos taurus', code: '0102', latinName: 'Bos taurus' },
  // Microchip, passport and horse name; let off CPH. MDM spells it with one l.
  horse: { searchTerm: 'horse', code: '0101', latinName: 'Equus cabalus' },
  // Microchip, passport, tattoo and a permanent address; let off CPH.
  domesticCat: { searchTerm: 'domestic cat', code: '01061900', latinName: 'Felis catus' },
  // Asked for no identifier at all.
  ostrich: { searchTerm: 'ostrich', code: '01063300', latinName: 'Struthio' },
} as const satisfies Record<string, CommodityLine>;

/** The key the picker's tick box submits, and the one a seeded post sends. */
export const selectionKey = (line: CommodityLine): string => `${line.code}|${line.latinName}`;

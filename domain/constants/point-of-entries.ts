export const pointOfEntries = {
  aberdeen: { value: 'GB DYC', display: 'Aberdeen Airport (GB DYC)' },
  eastMidlandsAirport: { value: 'GB EMA', display: 'East Midlands Airport (GB EMA)' },
  edinburgh: { value: 'GB EDI', display: 'Edinburgh Airport (GB EDI)' },
} as const;

export type PointOfEntry = (typeof pointOfEntries)[keyof typeof pointOfEntries];

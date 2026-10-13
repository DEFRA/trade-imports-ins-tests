import { portByCode } from '@domain/shared/fixtures/reference-data';

export const pointOfEntries = {
  aberdeen: portByCode('GB DYC'),
  aberdeenHarbour: portByCode('GB ABD'),
  eastMidlandsAirport: portByCode('GB EMA'),
  edinburgh: portByCode('GB EDI'),
} as const;

export type PointOfEntry = (typeof pointOfEntries)[keyof typeof pointOfEntries];

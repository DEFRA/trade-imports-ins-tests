import { fileURLToPath } from 'node:url';

const pathFromHere = (filename: string): string => fileURLToPath(new URL(filename, import.meta.url));

/** Copies of the animals frontend's `_capture/fixtures`, recaptured from reference data. */
export const referenceDataPaths = {
  countries: pathFromHere('./countries.json'),
  countriesOrigin: pathFromHere('./countries-origin.json'),
  portsOfEntry: pathFromHere('./ports-of-entry.json'),
} as const;

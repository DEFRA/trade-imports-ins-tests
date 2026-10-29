import { readFileSync } from 'node:fs';
import { referenceDataPaths } from '@resources/reference-data/paths';

export interface CapturedCountry {
  code: string;
  name: string;
  subDivisions: { code: string; name: string }[];
}

export type PortType = 'airport' | 'seaport' | 'rail';

export interface CapturedPort {
  code: string;
  name: string;
  type: PortType | null;
}

type CapturedSubDivision = CapturedCountry['subDivisions'][number];

const readFixture = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf-8')) as T;

export const countries = readFixture<CapturedCountry[]>(referenceDataPaths.countries);
export const countriesOrigin = readFixture<CapturedCountry[]>(referenceDataPaths.countriesOrigin);
export const portsOfEntry = readFixture<CapturedPort[]>(referenceDataPaths.portsOfEntry);

export function countryByCode(code: string): { value: string; display: string } {
  const country = countriesOrigin.find((candidate) => candidate.code === code);
  if (!country) {
    throw new Error(`Country ${code} is not in the captured origin list`);
  }
  return { value: country.code, display: country.name };
}

function subdivisionNamedWithCountry(subDivision: CapturedSubDivision, country: CapturedCountry): string {
  return `${subDivision.name} (${country.name})`;
}

/** A country subdivision, whose display is "<subdivision> (<country>)". */
export function subdivisionByCode(code: string): { value: string; display: string } {
  for (const country of countriesOrigin) {
    const subDivision = country.subDivisions.find((candidate) => candidate.code === code);
    if (subDivision) {
      return { value: subDivision.code, display: subdivisionNamedWithCountry(subDivision, country) };
    }
  }
  throw new Error(`Subdivision ${code} is not in the captured origin list`);
}

function countryNamesWithSubdivisions(subdivisionName: (subDivision: CapturedSubDivision, country: CapturedCountry) => string): string[] {
  return countriesOrigin
    .flatMap((country) => [country.name, ...country.subDivisions.map((subDivision) => subdivisionName(subDivision, country))])
    .sort((first, second) => first.localeCompare(second));
}

/** Each origin country and each of its subdivisions by its own name, sorted by name. */
export function countryAndSubdivisionNames(): string[] {
  return countryNamesWithSubdivisions((subDivision) => subDivision.name);
}

/** Each origin country and each of its subdivisions named "<subdivision> (<country>)", sorted by name. */
export function countryAndSubdivisionNamesWithCountry(): string[] {
  return countryNamesWithSubdivisions(subdivisionNamedWithCountry);
}

/** Every captured unfiltered country by name, plus United Kingdom, in alphabetical order. */
export const addFormCountryNames: string[] = [...countries.map(({ name }) => name), 'United Kingdom'].toSorted((first, second) =>
  first.localeCompare(second, 'en'),
);

/** The label of a port, '<name> - <code>'. */
export function portLabel(port: CapturedPort): string {
  return `${port.name} - ${port.code}`;
}

export function portByCode(code: string): { value: string; display: string } {
  const port = portsOfEntry.find((candidate) => candidate.code === code);
  if (!port) {
    throw new Error(`Port ${code} is not in the captured ports of entry`);
  }
  return { value: port.code, display: portLabel(port) };
}

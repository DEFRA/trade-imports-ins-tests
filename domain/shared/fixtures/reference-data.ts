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

function countryAndTerritoryNames(): string[] {
  return countriesOrigin
    .flatMap((country) => [country.name, ...country.subDivisions.map((subDivision) => `${subDivision.name} (${country.name})`)])
    .sort((first, second) => first.localeCompare(second));
}

/** The origin page lists each origin country and each territory named "<territory> (<country>)", sorted by name. */
export function originPageCountryNames(): string[] {
  return countryAndTerritoryNames();
}

/** A destination country select lists each origin country and each territory named "<territory> (<country>)", sorted by name. */
export function destinationCountryNames(): string[] {
  return countryAndTerritoryNames();
}

/** Every port select and review row reads '<name> - <code>'. */
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

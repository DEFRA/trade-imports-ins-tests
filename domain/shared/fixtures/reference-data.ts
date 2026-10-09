import { readFileSync } from 'node:fs';
import { referenceDataPaths } from '@resources/reference-data/paths';

export interface CapturedCountry {
  code: string;
  name: string;
  subDivisions: { code: string; name: string }[];
}

export interface CapturedPort {
  code: string;
  name: string;
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

/** The origin page lists each origin country and each of its subdivisions, sorted by name. */
export function originPageCountryNames(): string[] {
  return countriesOrigin
    .flatMap((country) => [country.name, ...country.subDivisions.map((subDivision) => subDivision.name)])
    .sort((first, second) => first.localeCompare(second));
}

/** A destination country select lists each origin country and each territory named "<territory> (<country>)", sorted by name. */
export function destinationCountryNames(): string[] {
  return countriesOrigin
    .flatMap((country) => [country.name, ...country.subDivisions.map((subDivision) => `${subDivision.name} (${country.name})`)])
    .sort((first, second) => first.localeCompare(second));
}

export function portLabel(port: CapturedPort): string {
  return `${port.name} (${port.code})`;
}

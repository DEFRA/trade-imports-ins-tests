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

export function portLabel(port: CapturedPort): string {
  return `${port.name} (${port.code})`;
}

/** A port of exit option reads '<name> - <code>'. */
export function portOfExitLabel(port: CapturedPort): string {
  return `${port.name} - ${port.code}`;
}

const PORT_TYPE_RANKS: Record<PortType, number> = { airport: 0, seaport: 1, rail: 2 };
const UNKNOWN_PORT_TYPE_RANK = 3;

function typeRank(port: CapturedPort): number {
  return port.type === null ? UNKNOWN_PORT_TYPE_RANK : PORT_TYPE_RANKS[port.type];
}

function sortableName(port: CapturedPort): string {
  return port.name.replace(/\s+/g, ' ').trim().toLowerCase();
}

function compareText(first: string, second: string): number {
  if (first < second) {
    return -1;
  }
  return first > second ? 1 : 0;
}

/**
 * Reference data lists airports, then seaports, then rail ports, each A to Z by name ignoring letter case,
 * with non-breaking and doubled spaces read as one.
 */
export function portsInListOrder(): CapturedPort[] {
  return [...portsOfEntry].sort(
    (first, second) =>
      typeRank(first) - typeRank(second) || compareText(sortableName(first), sortableName(second)) || compareText(first.code, second.code),
  );
}

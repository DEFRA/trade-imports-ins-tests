import { relative, sep } from 'node:path';

/** One domain per deployable app; each owns every spec under tests/<domain>/. */
export const DOMAINS = ['animals', 'animals-admin', 'ins', 'plants'] as const;

export type Domain = (typeof DOMAINS)[number];

const DOMAIN_ENV_VARS: Record<Domain, string> = {
  animals: 'TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL',
  'animals-admin': 'TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL',
  ins: 'TRADE_IMPORTS_INS_FRONTEND_BASE_URL',
  plants: 'TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL',
};

const isDomain = (name: string): name is Domain => (DOMAINS as readonly string[]).includes(name);

/**
 * Sets the per-domain base URL environment variables from a lookup map, so specs get their
 * domain's baseURL (see baseUrlForDomain) and can navigate cross-service using absolute URLs.
 * Called from each environment config; workers load the config too, so they see the same values.
 */
export function applyDomainBaseUrls(domainBaseUrls: Record<Domain, string>, context: string): void {
  for (const domain of DOMAINS) {
    const baseURL = domainBaseUrls[domain];
    if (!baseURL) {
      throw new Error(`No ${context} baseURL configured for domain: ${domain}`);
    }
    process.env[DOMAIN_ENV_VARS[domain]] = baseURL;
  }
}

/** The domain a spec belongs to: the first directory under the test directory. */
export function domainFromSpecPath(file: string, testDir: string): Domain {
  const [domain] = relative(testDir, file).split(sep);
  if (!isDomain(domain)) {
    throw new Error(`Spec ${file} is not under tests/<domain>/ for a known domain (${DOMAINS.join(', ')}).`);
  }
  return domain;
}

export function baseUrlForDomain(domain: Domain): string {
  const baseURL = process.env[DOMAIN_ENV_VARS[domain]];
  if (!baseURL) {
    throw new Error(`${DOMAIN_ENV_VARS[domain]} is not set. Ensure Playwright config applies it before running tests.`);
  }
  return baseURL;
}

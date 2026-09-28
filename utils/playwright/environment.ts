import { test } from '@playwright/test';

const PROD_ENVIRONMENT = 'prod';

export function getEnvironment(): string | undefined {
  return process.env.ENVIRONMENT ?? process.env.PLAYWRIGHT_ENVIRONMENT;
}

/**
 * True when Playwright is running locally (not CI, not from inside CDP)
 * against a CDP environment. Backend services aren't reachable from outside
 * CDP's network via their direct URL, so this switches to the protected
 * ephemeral gateway instead — see cdpServiceUrl().
 */
export function isCdpLocal(): boolean {
  return process.env.CDP_LOCAL === 'true';
}

export function throwIfProdEnvironment(environment = getEnvironment()): void {
  if (environment?.toLowerCase() === PROD_ENVIRONMENT) {
    throw new Error(
      'Refusing to run Playwright tests against prod environment. Set ENVIRONMENT/PLAYWRIGHT_ENVIRONMENT to a non-prod value.',
    );
  }
}

/**
 * True when Playwright targets a deployed CDP hostname (dev, test, etc.).
 */
export function isCdpHostedEnvironment(): boolean {
  const baseUrl = String(test.info().project.use.baseURL ?? '').toLowerCase();
  return baseUrl.includes('.cdp-int.defra.cloud');
}

/**
 * Skip a test when running against CDP hosted environments.
 */
export function skipIfCdpEnvironment(reason: string): void {
  test.skip(isCdpHostedEnvironment(), reason);
}

/**
 * True when animals-frontend runs outside stub mode — compose (LIVE_ANIMALS_MODE=real)
 * and CDP (production) both render the INS handshake link.
 */
export function isNonStubStackEnvironment(): boolean {
  return isComposeEnvironment() || isCdpHostedEnvironment();
}

/**
 * Skip when the stack runs outside stub mode (compose or CDP).
 */
export function skipIfNonStubStackEnvironment(reason: string): void {
  test.skip(isNonStubStackEnvironment(), reason);
}

/**
 * Skip everywhere except non-stub stacks (compose or CDP).
 */
export function skipUnlessNonStubStackEnvironment(reason: string): void {
  test.skip(!isNonStubStackEnvironment(), reason);
}

/**
 * True when running against the Docker Compose stack (local or GitHub) — the only environment
 * with direct Mongo access, so persistence assertions gate on this rather than a tag.
 */
export function isComposeEnvironment(): boolean {
  const baseUrl = String(test.info().project.use.baseURL ?? '').toLowerCase();
  return baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('cdp-docker.test');
}

/**
 * Skip a test when running against the Docker Compose stack (local or GitHub).
 */
export function skipIfComposeEnvironment(reason: string): void {
  test.skip(isComposeEnvironment(), reason);
}

/**
 * Skip a test everywhere except the Docker Compose stack. Guards assertions that
 * read Mongo directly — MONGODB_URI is only applied by the compose Playwright
 * config, so these cannot run against a CDP environment.
 */
export function skipUnlessComposeEnvironment(reason: string): void {
  test.skip(!isComposeEnvironment(), reason);
}

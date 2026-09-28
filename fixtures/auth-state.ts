import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  expect,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Locator,
  type Page,
  type WorkerInfo,
} from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';
import { NotificationDashboardPage } from '@page-objects/notification/notification-dashboard-page';
import { AdminDashboardPage } from '@page-objects/admin/admin-dashboard-page';
import { InsAddressBookListPage } from '@page-objects/ins/ins-address-book-list-page';
import { PlantsDashboardPage } from '@page-objects/plants/plants-dashboard-page';

const AUTH_STATE_DIR = resolve(process.cwd(), 'playwright/.auth');

export const AUTH_COOKIE_NAME = 'sid';

const LOCAL_STACK_HOSTS = ['localhost', '127.0.0.1', 'cdp-docker.test'];

const COMPOSE_AUTH_COOKIE_NAMES: Record<string, string> = { ins: 'ins-sid', plants: 'plants-sid' };

const isLocalStackUrl = (baseURL: string): boolean => {
  const url = baseURL.toLowerCase();
  return LOCAL_STACK_HOSTS.some((host) => url.includes(host));
};

export const authCookieNameFor = (targetName: string, baseURL?: string): string => {
  if (process.env.AUTH_SESSION_COOKIE_NAME) {
    return process.env.AUTH_SESSION_COOKIE_NAME;
  }
  const composeCookieName = COMPOSE_AUTH_COOKIE_NAMES[targetName];
  if (composeCookieName && baseURL && isLocalStackUrl(baseURL)) {
    return composeCookieName;
  }
  return AUTH_COOKIE_NAME;
};

export const LANDING_TIMEOUT_MS = 20_000;
const SIGN_IN_ATTEMPTS = 2;

type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

const coldStartState: StorageState = { cookies: [], origins: [] };
Object.freeze(coldStartState.cookies);
Object.freeze(coldStartState.origins);
export const COLD_START: StorageState = Object.freeze(coldStartState);

export type AuthTarget = {
  landingPath: string;
  landingHeading: (page: Page) => Locator;
};

// The sign-in failure page also has an h1, so each target asserts its own landing
// heading — a bare level-1 check would save an unauthenticated state file.
export const AUTH_TARGETS: Record<string, AuthTarget> = {
  e2e: { landingPath: '/', landingHeading: (page) => new NotificationDashboardPage(page).heading },
  admin: { landingPath: '/', landingHeading: (page) => new AdminDashboardPage(page).heading },
  ins: {
    landingPath: '/address-book',
    landingHeading: (page) => new InsAddressBookListPage(page).heading,
  },
  plants: { landingPath: '/', landingHeading: (page) => new PlantsDashboardPage(page).heading },
};

const slug = (baseUrl: string): string => baseUrl.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-');

// The services share the localhost cookie domain but keep separate session-store
// prefixes, so a sid minted against one is a cache miss against the others.
const authStatePath = (targetName: string, baseUrl: string, workerIndex: number): string =>
  resolve(AUTH_STATE_DIR, `${targetName}-${slug(baseUrl)}-w${workerIndex}.json`);

export type AuthMint = {
  targetName: string;
  baseURL: string;
  workerIndex: number;
  proxy?: BrowserContextOptions['proxy'];
  ignoreHTTPSErrors?: boolean;
};

export const createAuthState = async (browser: Browser, mint: AuthMint): Promise<string> => {
  const { targetName, baseURL, workerIndex, proxy, ignoreHTTPSErrors } = mint;
  const target = AUTH_TARGETS[targetName];
  if (!target) {
    throw new Error(`No auth target named "${targetName}" — add one to AUTH_TARGETS in fixtures/auth-state.ts.`);
  }

  // browser.newContext() does not inherit project-level options: without these a
  // security-profile mint bypasses the ZAP proxy and a CDP mint fails TLS.
  const contextOptions: BrowserContextOptions = { baseURL, proxy, ignoreHTTPSErrors };

  mkdirSync(AUTH_STATE_DIR, { recursive: true });
  const statePath = authStatePath(targetName, baseURL, workerIndex);
  const mintingPath = `${statePath}.minting`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= SIGN_IN_ATTEMPTS; attempt++) {
    const context = await browser.newContext(contextOptions);
    try {
      const page = await context.newPage();
      await page.goto(target.landingPath);
      await new SignInPage(page).signIn();
      await expect(target.landingHeading(page)).toBeVisible({ timeout: LANDING_TIMEOUT_MS });

      const authOnlyState = stripToAuthCookie(await context.storageState(), baseURL, authCookieNameFor(targetName, baseURL));
      writeFileSync(mintingPath, JSON.stringify(authOnlyState, null, 2));
      await verifySavedState(browser, contextOptions, target, mintingPath);
      renameSync(mintingPath, statePath);
      return statePath;
    } catch (error) {
      lastError = error;
    } finally {
      rmSync(mintingPath, { force: true });
      await context.close();
    }
  }

  throw new Error(`Worker ${workerIndex} could not sign in to ${baseURL} in ${SIGN_IN_ATTEMPTS} attempts`, {
    cause: lastError,
  });
};

export const createWorkerAuthState = async (browser: Browser, workerInfo: WorkerInfo): Promise<string> => {
  const { name } = workerInfo.project;
  const { baseURL, proxy, ignoreHTTPSErrors } = workerInfo.project.use;
  if (!baseURL) {
    throw new Error(`Project "${name}" has no baseURL, so no session can be minted for it.`);
  }

  return createAuthState(browser, {
    targetName: name,
    baseURL,
    workerIndex: workerInfo.workerIndex,
    proxy,
    ignoreHTTPSErrors,
  });
};

/** The yar `session` cookie carries per-user journey state that would bleed across a worker's tests. */
export const stripToAuthCookie = (state: StorageState, baseUrl: string, cookieName: string = AUTH_COOKIE_NAME): StorageState => {
  const cookies = state.cookies.filter((cookie) => cookie.name === cookieName);
  if (cookies.length === 0) {
    throw new Error(`Sign-in to ${baseUrl} produced no "${cookieName}" session cookie to save.`);
  }
  return { cookies, origins: [] };
};

// Restoring the file here fails a bad strip at mint time, not in every test that later restores it.
const verifySavedState = async (
  browser: Browser,
  contextOptions: BrowserContextOptions,
  target: AuthTarget,
  statePath: string,
): Promise<void> => {
  const context = await browser.newContext({ ...contextOptions, storageState: statePath });
  try {
    const page = await context.newPage();
    await page.goto(target.landingPath);
    await expect(target.landingHeading(page)).toBeVisible({ timeout: LANDING_TIMEOUT_MS });
  } finally {
    await context.close();
  }
};

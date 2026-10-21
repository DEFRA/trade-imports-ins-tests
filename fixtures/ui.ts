import { test as base, expect, type APIRequestContext, type TestInfo } from '@playwright/test';
import {
  createAnimalsAdminPages,
  createAnimalsPages,
  createInsPages,
  createPlantsPages,
  createSharedPages,
  type AnimalsAdminPages,
  type AnimalsPages,
  type InsPages,
  type PlantsPages,
  type SharedPages,
} from '@page-objects';
import type { JourneyContext } from '@flows/shared/journey-context';
import { AnimalsJourney } from '@flows/animals/journey';
import { AnimalsNotificationActions } from '@flows/animals/notification-actions';
import { AnimalsSeededJourney } from '@flows/animals/seeded-journey';
import { AnimalsAdminNavigation } from '@flows/animals-admin/navigation';
import { PlantsJourney } from '@flows/plants/journey';
import { PlantsNotificationActions } from '@flows/plants/notification-actions';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { FrontendFormClient } from '@adapters/http/frontend-form-client';
import { createWorkerAuthStates, type AuthStateFor } from '@fixtures/auth-state';
import { createFrontendSeedContext, signInFrontendSeedState } from '@fixtures/seed-context';
import { getCdpProxy } from '@config/cdp-proxy';
import { baseUrlForDomain, domainFromSpecPath } from '@utils/playwright/domain-base-urls';
import { sessionReuseEnabled } from '@utils/playwright/session-reuse';

// Signing in takes longer than a test's own budget, so the fixtures that mint a session get theirs.
const SESSION_MINT_TIMEOUT_MS = 120_000;

const domainOf = ({ file, project }: TestInfo) => domainFromSpecPath(file, project.testDir);

export interface AuthWorkerFixtures {
  authStateFor: AuthStateFor | undefined;
  frontendSeedState: string;
}

export interface PageFixtures {
  pages: SharedPages;
  animalsPages: AnimalsPages;
  animalsAdminPages: AnimalsAdminPages;
  insPages: InsPages;
  plantsPages: PlantsPages;
  journeyContext: JourneyContext;
  animalsJourney: AnimalsJourney;
  animalsSeededJourney: AnimalsSeededJourney;
  animalsNotificationActions: AnimalsNotificationActions;
  animalsAdminNavigation: AnimalsAdminNavigation;
  plantsJourney: PlantsJourney;
  plantsNotificationActions: PlantsNotificationActions;
  notificationApi: NotificationApiClient;
  addressBookApi: AddressBookApiClient;
  frontendSeedContext: APIRequestContext;
  frontendForms: FrontendFormClient;
  externalRequest: APIRequestContext;
}

export const test = base.extend<PageFixtures, AuthWorkerFixtures>({
  authStateFor: [
    async ({ browser }, use, workerInfo) => {
      await use(sessionReuseEnabled() ? createWorkerAuthStates(browser, workerInfo) : undefined);
    },
    { scope: 'worker' },
  ],
  frontendSeedState: [
    async ({ browser, authStateFor }, use, workerInfo) => {
      await use(await signInFrontendSeedState(browser, workerInfo, authStateFor));
    },
    { scope: 'worker', timeout: SESSION_MINT_TIMEOUT_MS },
  ],
  frontendSeedContext: async ({ frontendSeedState }, use, testInfo) => {
    const context = await createFrontendSeedContext(frontendSeedState, testInfo.project.use);
    await use(context);
    await context.dispose();
  },
  // The spec's directory picks its domain, so one project can run every domain's specs.
  // eslint-disable-next-line no-empty-pattern
  baseURL: async ({}, use, testInfo) => {
    await use(baseUrlForDomain(domainOf(testInfo)));
  },
  storageState: [
    async ({ authStateFor }, use, testInfo) => {
      await use(authStateFor ? await authStateFor(domainOf(testInfo)) : undefined);
    },
    { scope: 'test', timeout: SESSION_MINT_TIMEOUT_MS },
  ],
  pages: async ({ page }, use) => {
    await use(createSharedPages(page));
  },
  animalsPages: async ({ page }, use) => {
    await use(createAnimalsPages(page));
  },
  animalsAdminPages: async ({ page }, use) => {
    await use(createAnimalsAdminPages(page));
  },
  insPages: async ({ page }, use) => {
    await use(createInsPages(page));
  },
  plantsPages: async ({ page }, use) => {
    await use(createPlantsPages(page));
  },
  // eslint-disable-next-line no-empty-pattern
  journeyContext: async ({}, use) => {
    await use({});
  },
  animalsJourney: async ({ animalsPages, pages, journeyContext }, use) => {
    await use(new AnimalsJourney(animalsPages, pages, journeyContext));
  },
  animalsNotificationActions: async ({ animalsPages, pages }, use) => {
    await use(new AnimalsNotificationActions(animalsPages, pages));
  },
  animalsAdminNavigation: async ({ animalsAdminPages }, use) => {
    await use(new AnimalsAdminNavigation(animalsAdminPages));
  },
  plantsJourney: async ({ plantsPages, journeyContext }, use) => {
    await use(new PlantsJourney(plantsPages, journeyContext));
  },
  plantsNotificationActions: async ({ plantsPages, pages }, use) => {
    await use(new PlantsNotificationActions(plantsPages, pages));
  },
  notificationApi: async ({ request }, use) => {
    await use(new NotificationApiClient(request));
  },
  addressBookApi: async ({ request }, use) => {
    await use(new AddressBookApiClient(request));
  },
  frontendForms: async ({ frontendSeedContext }, use) => {
    await use(new FrontendFormClient(frontendSeedContext));
  },
  // Calls that leave CDP for the internet go through its proxy; the journey and service calls stay direct.
  externalRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({ proxy: getCdpProxy() });
    await use(context);
    await context.dispose();
  },
  animalsSeededJourney: async ({ frontendForms, addressBookApi, journeyContext }, use) => {
    await use(new AnimalsSeededJourney(frontendForms, addressBookApi, journeyContext));
  },
});

export { expect };

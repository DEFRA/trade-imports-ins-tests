import { test as base, expect, type APIRequestContext } from '@playwright/test';
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
import { Journey, type JourneyContext } from '@flows/journey';
import { PlantsJourney } from '@flows/plants-journey';
import { AdminNavigation } from '@flows/admin-navigation';
import { NotificationActions } from '@flows/notification-actions';
import { SeededJourney } from '@flows/seeded-journey';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { FrontendFormClient } from '@adapters/http/frontend-form-client';
import { createWorkerAuthState } from '@fixtures/auth-state';
import { createFrontendSeedContext } from '@fixtures/seed-context';
import { sessionReuseEnabled } from '@utils/playwright/session-reuse';

// frontendSeedContext mints its own session when session reuse is off or the project's baseURL is not the frontend, so both worker fixtures need their own budget rather than the test timeout.
const SESSION_MINT_TIMEOUT_MS = 120_000;

export interface AuthWorkerFixtures {
  workerAuthState: string | undefined;
  frontendSeedContext: APIRequestContext;
}

export interface PageFixtures {
  pages: SharedPages;
  animalsPages: AnimalsPages;
  animalsAdminPages: AnimalsAdminPages;
  insPages: InsPages;
  plantsPages: PlantsPages;
  journeyContext: JourneyContext;
  journey: Journey;
  plantsJourney: PlantsJourney;
  adminNavigation: AdminNavigation;
  notificationActions: NotificationActions;
  notificationApi: NotificationApiClient;
  addressBookApi: AddressBookApiClient;
  frontendForms: FrontendFormClient;
  seededJourney: SeededJourney;
}

export const test = base.extend<PageFixtures, AuthWorkerFixtures>({
  workerAuthState: [
    async ({ browser }, use, workerInfo) => {
      if (!sessionReuseEnabled()) {
        await use(undefined);
        return;
      }
      await use(await createWorkerAuthState(browser, workerInfo));
    },
    { scope: 'worker', timeout: SESSION_MINT_TIMEOUT_MS },
  ],
  frontendSeedContext: [
    async ({ browser, workerAuthState }, use, workerInfo) => {
      const context = await createFrontendSeedContext(browser, workerInfo, workerAuthState);
      await use(context);
      await context.dispose();
    },
    { scope: 'worker', timeout: SESSION_MINT_TIMEOUT_MS },
  ],
  storageState: async ({ workerAuthState }, use) => {
    await use(workerAuthState);
  },
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
  journey: async ({ animalsPages, pages, journeyContext }, use) => {
    await use(new Journey(animalsPages, pages, journeyContext));
  },
  plantsJourney: async ({ plantsPages, journeyContext }, use) => {
    await use(new PlantsJourney(plantsPages, journeyContext));
  },
  adminNavigation: async ({ animalsAdminPages }, use) => {
    await use(new AdminNavigation(animalsAdminPages));
  },
  notificationActions: async ({ animalsPages, pages }, use) => {
    await use(new NotificationActions(animalsPages, pages));
  },
  notificationApi: async ({ request }, use) => {
    await use(new NotificationApiClient(request));
  },
  addressBookApi: async ({ request }, use) => {
    const addressBookApi = new AddressBookApiClient(request);
    await use(addressBookApi);
    await addressBookApi.deleteCreatedAddresses();
  },
  frontendForms: async ({ frontendSeedContext }, use) => {
    await use(new FrontendFormClient(frontendSeedContext));
  },
  seededJourney: async ({ frontendForms, addressBookApi, journeyContext }, use) => {
    await use(new SeededJourney(frontendForms, addressBookApi, journeyContext));
  },
});

export { expect };

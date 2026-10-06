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
import type { JourneyContext } from '@flows/shared/journey-context';
import { AnimalsJourney } from '@flows/animals/journey';
import { AnimalsNotificationActions } from '@flows/animals/notification-actions';
import { AnimalsSeededJourney } from '@flows/animals/seeded-journey';
import { AnimalsAdminNavigation } from '@flows/animals-admin/navigation';
import { PlantsJourney } from '@flows/plants/journey';
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
  animalsJourney: AnimalsJourney;
  animalsSeededJourney: AnimalsSeededJourney;
  animalsNotificationActions: AnimalsNotificationActions;
  animalsAdminNavigation: AnimalsAdminNavigation;
  plantsJourney: PlantsJourney;
  notificationApi: NotificationApiClient;
  addressBookApi: AddressBookApiClient;
  frontendForms: FrontendFormClient;
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
  notificationApi: async ({ request }, use) => {
    await use(new NotificationApiClient(request));
  },
  addressBookApi: async ({ request }, use) => {
    await use(new AddressBookApiClient(request));
  },
  frontendForms: async ({ frontendSeedContext }, use) => {
    await use(new FrontendFormClient(frontendSeedContext));
  },
  animalsSeededJourney: async ({ frontendForms, addressBookApi, journeyContext }, use) => {
    await use(new AnimalsSeededJourney(frontendForms, addressBookApi, journeyContext));
  },
});

export { expect };

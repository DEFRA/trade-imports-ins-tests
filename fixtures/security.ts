import { request } from '@playwright/test';
import { test as base, expect } from '@fixtures';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { getPlantsBackendBaseUrl } from '@config/service-base-urls';
import { zapPort } from '@config/zap';

export interface SecurityFixtures {
  proxiedNotificationApi: NotificationApiClient;
  proxiedPlantsNotificationApi: NotificationApiClient;
}

export const test = base.extend<SecurityFixtures>({
  // eslint-disable-next-line no-empty-pattern
  proxiedNotificationApi: async ({}, use) => {
    const context = await request.newContext({ proxy: { server: `http://localhost:${zapPort}` } });
    await use(new NotificationApiClient(context));
    await context.dispose();
  },
  // eslint-disable-next-line no-empty-pattern
  proxiedPlantsNotificationApi: async ({}, use) => {
    const context = await request.newContext({ proxy: { server: `http://localhost:${zapPort}` } });
    await use(new NotificationApiClient(context, getPlantsBackendBaseUrl()));
    await context.dispose();
  },
});

export { expect };

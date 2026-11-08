import { test, expect } from '@fixtures';
import { E2E_ORGANISATION_ID } from '@adapters/http/trader-api-headers';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { getPlantsBackendBaseUrl } from '@config/service-base-urls';
import { RestClientError } from '@adapters/http/rest-client';

const OTHER_ORGANISATION_ID = '9999999';

const expectStatus = async (action: () => Promise<unknown>, status: number) => {
  let caught: unknown;
  try {
    await action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(RestClientError);
  expect((caught as RestClientError).status).toBe(status);
};

test.describe('Organisation-scoped plants notifications (backend API)', { tag: '@active' }, () => {
  test('returns 403 when another organisation reads fulfilments', async ({ request, journeyContext }) => {
    const baseUrl = getPlantsBackendBaseUrl();
    const ownerApi = new NotificationApiClient(request, baseUrl, undefined, E2E_ORGANISATION_ID);
    const draft = await ownerApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);
    await ownerApi.submitNotification(draft.referenceNumber, draft.concurrencyToken);

    const otherOrgApi = new NotificationApiClient(request, baseUrl, undefined, OTHER_ORGANISATION_ID);

    await expectStatus(() => otherOrgApi.getNotificationFulfilments(draft.referenceNumber), 403);
  });

  test('returns no rows when another organisation lists by reference', async ({ request, journeyContext }) => {
    const baseUrl = getPlantsBackendBaseUrl();
    const ownerApi = new NotificationApiClient(request, baseUrl, undefined, E2E_ORGANISATION_ID);
    const draft = await ownerApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);

    const otherOrgApi = new NotificationApiClient(request, baseUrl, undefined, OTHER_ORGANISATION_ID);
    const page = await otherOrgApi.listNotifications(draft.referenceNumber);
    expect(page.totalElements).toBe(0);
  });

  test('returns 404 when another organisation mutates a notification', async ({ request, journeyContext }) => {
    const baseUrl = getPlantsBackendBaseUrl();
    const ownerApi = new NotificationApiClient(request, baseUrl, undefined, E2E_ORGANISATION_ID);
    const draft = await ownerApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);
    await ownerApi.submitNotification(draft.referenceNumber, draft.concurrencyToken);

    const otherOrgApi = new NotificationApiClient(request, baseUrl, undefined, OTHER_ORGANISATION_ID);
    const { referenceNumber, concurrencyToken } = draft;

    await expectStatus(() => otherOrgApi.amendNotification(referenceNumber), 404);
    await expectStatus(
      () =>
        otherOrgApi.saveNotification(referenceNumber, concurrencyToken, {
          referenceNumber,
          concurrencyToken,
        }),
      404,
    );
    await expectStatus(() => otherOrgApi.submitNotification(referenceNumber, concurrencyToken), 404);
    await expectStatus(() => otherOrgApi.copyNotification(referenceNumber, concurrencyToken), 404);
    await expectStatus(() => otherOrgApi.softDeleteNotification(referenceNumber), 404);
  });
});

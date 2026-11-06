import { test, expect } from '@fixtures';
import { E2E_ORGANISATION_ID } from '@adapters/http/address-book-api-client';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { getPlantsBackendBaseUrl } from '@config/service-base-urls';
import { RestClientError } from '@adapters/http/rest-client';

const OTHER_ORGANISATION_ID = '9999999';

test.describe('Organisation-scoped plants notifications (backend API)', { tag: '@active' }, () => {
  test('returns 403 when another organisation reads fulfilments', async ({ request, journeyContext }) => {
    const baseUrl = getPlantsBackendBaseUrl();
    const ownerApi = new NotificationApiClient(request, baseUrl, undefined, E2E_ORGANISATION_ID);
    const draft = await ownerApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);
    await ownerApi.submitNotification(draft.referenceNumber, draft.concurrencyToken);

    const otherOrgApi = new NotificationApiClient(request, baseUrl, undefined, OTHER_ORGANISATION_ID);

    let caught: unknown;
    try {
      await otherOrgApi.getNotificationFulfilments(draft.referenceNumber);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(RestClientError);
    expect((caught as RestClientError).status).toBe(403);
  });
});

import { test, expect } from '@fixtures/security';
import { notificationStatuses } from '@domain/animals/models/api/notification-status';

test.describe('Security scan (backend)', { tag: '@active' }, () => {
  test('submitting through the ZAP proxy returns Submitted action required', async ({ proxiedNotificationApi, journeyContext }) => {
    const draft = await proxiedNotificationApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);
    const submitted = await proxiedNotificationApi.submitNotification(draft.referenceNumber, draft.concurrencyToken);

    expect(submitted.status).toBe(notificationStatuses.submittedActionRequired);
  });
});

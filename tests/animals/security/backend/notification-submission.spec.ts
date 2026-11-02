import { test, expect } from '@fixtures/security';

test.describe('Security scan (backend)', { tag: '@active' }, () => {
  test('routes a submitted notification through the ZAP proxy', async ({ proxiedNotificationApi, journeyContext }) => {
    const draft = await proxiedNotificationApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);
    const submitted = await proxiedNotificationApi.submitNotification(draft.referenceNumber, draft.concurrencyToken);

    expect(submitted.status).toBe('SUBMITTED');
  });
});

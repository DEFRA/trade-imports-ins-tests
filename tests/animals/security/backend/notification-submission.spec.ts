import { test, expect } from '@fixtures/security';

test.describe('Security scan (backend)', { tag: '@active' }, () => {
  test('routes a submitted notification through the ZAP proxy', async ({ proxiedNotificationApi }) => {
    const draft = await proxiedNotificationApi.createNotification();
    const submitted = await proxiedNotificationApi.submitNotification(draft.referenceNumber);

    expect(submitted.status).toBe('SUBMITTED');
  });
});

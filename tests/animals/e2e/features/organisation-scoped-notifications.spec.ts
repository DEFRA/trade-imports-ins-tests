import { test, expect } from '@fixtures';
import { expectRefusalWith } from '@adapters/http/expect-api-refusal';

test.describe('Organisation-scoped notifications (backend API)', () => {
  test('returns 403 when another organisation reads fulfilments', async ({
    notificationApi,
    otherOrganisationNotificationApi,
    journeyContext,
  }) => {
    const draft = await notificationApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);
    await notificationApi.submitNotification(draft.referenceNumber, draft.concurrencyToken);

    await expectRefusalWith(() => otherOrganisationNotificationApi.getNotificationFulfilments(draft.referenceNumber), 403);
  });

  test('returns no rows when another organisation lists by reference', async ({
    notificationApi,
    otherOrganisationNotificationApi,
    journeyContext,
  }) => {
    const draft = await notificationApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);

    const totalElements = await otherOrganisationNotificationApi.countNotifications(draft.referenceNumber);
    expect(totalElements).toBe(0);
  });

  test('returns 404 when another organisation mutates a notification', async ({
    notificationApi,
    otherOrganisationNotificationApi,
    journeyContext,
  }) => {
    const draft = await notificationApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);
    await notificationApi.submitNotification(draft.referenceNumber, draft.concurrencyToken);

    const { referenceNumber, concurrencyToken } = draft;

    await expectRefusalWith(() => otherOrganisationNotificationApi.amendNotification(referenceNumber), 404);
    await expectRefusalWith(() => otherOrganisationNotificationApi.saveNotification(referenceNumber, concurrencyToken), 404);
    await expectRefusalWith(() => otherOrganisationNotificationApi.submitNotification(referenceNumber, concurrencyToken), 404);
    await expectRefusalWith(() => otherOrganisationNotificationApi.copyNotification(referenceNumber, concurrencyToken), 404);
    await expectRefusalWith(() => otherOrganisationNotificationApi.softDeleteNotification(referenceNumber), 404);
    await expectRefusalWith(() => otherOrganisationNotificationApi.cancelAmendNotification(referenceNumber), 404);
  });
});

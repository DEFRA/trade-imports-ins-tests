import { test, expect } from '@fixtures';
import { expectRefusalWith } from '@adapters/http/expect-api-refusal';

test.describe('Organisation-scoped plants notifications (backend API)', () => {
  test('returns 403 when another organisation reads fulfilments', async ({
    plantsNotificationApi,
    otherOrganisationPlantsNotificationApi,
    journeyContext,
  }) => {
    const draft = await plantsNotificationApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);
    await plantsNotificationApi.submitNotification(draft.referenceNumber, draft.concurrencyToken);

    await expectRefusalWith(() => otherOrganisationPlantsNotificationApi.getNotificationFulfilments(draft.referenceNumber), 403);
  });

  test('returns no rows when another organisation lists by reference', async ({
    plantsNotificationApi,
    otherOrganisationPlantsNotificationApi,
    journeyContext,
  }) => {
    const draft = await plantsNotificationApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);

    const totalElements = await otherOrganisationPlantsNotificationApi.countNotifications(draft.referenceNumber);
    expect(totalElements).toBe(0);
  });

  test('returns 404 when another organisation mutates a notification', async ({
    plantsNotificationApi,
    otherOrganisationPlantsNotificationApi,
    journeyContext,
  }) => {
    const draft = await plantsNotificationApi.createNotification();
    journeyContext.recordReferenceNumber(draft.referenceNumber);
    await plantsNotificationApi.submitNotification(draft.referenceNumber, draft.concurrencyToken);

    const { referenceNumber, concurrencyToken } = draft;

    await expectRefusalWith(() => otherOrganisationPlantsNotificationApi.amendNotification(referenceNumber), 404);
    await expectRefusalWith(() => otherOrganisationPlantsNotificationApi.saveNotification(referenceNumber, concurrencyToken), 404);
    await expectRefusalWith(() => otherOrganisationPlantsNotificationApi.submitNotification(referenceNumber, concurrencyToken), 404);
    await expectRefusalWith(() => otherOrganisationPlantsNotificationApi.copyNotification(referenceNumber, concurrencyToken), 404);
    await expectRefusalWith(() => otherOrganisationPlantsNotificationApi.softDeleteNotification(referenceNumber), 404);
    await expectRefusalWith(() => otherOrganisationPlantsNotificationApi.cancelAmendNotification(referenceNumber), 404);
  });
});

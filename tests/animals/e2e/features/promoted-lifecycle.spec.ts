import { test, expect } from '@fixtures';
import { notificationStatuses } from '@domain/animals/models/api/notification-status';
import { MANDATORY_ANSWERS_WITH_ITAHC } from '@domain/animals/constants/journey-options';

test.describe('Notification lifecycle', { tag: '@compose' }, () => {
  test('records a notification submitted without an ITAHC as Submitted action required through amend and cancel, then copies it into distinct drafts and soft-deletes it', async ({
    notificationApi,
    journeyContext,
  }) => {
    const notification = await notificationApi.createNotification({ fulfilments: [] });
    const id = notification.referenceNumber;
    journeyContext.recordReferenceNumber(id);
    expect(notification.status).toBe(notificationStatuses.draft);

    const initial = await notificationApi.getNotificationFulfilments(id);
    expect(initial.referenceNumber).toBe(id);
    expect(initial.status).toBe(notificationStatuses.draft);
    expect(initial.fulfilments).toEqual([]);

    const submitted = await notificationApi.submitNotification(id, notification.concurrencyToken);
    expect(submitted.status).toBe(notificationStatuses.submittedActionRequired);
    const submittedFulfilments = await notificationApi.getNotificationFulfilments(id);
    expect(submittedFulfilments.status).toBe(notificationStatuses.submittedActionRequired);

    const amended = await notificationApi.amendNotification(id);
    expect(amended.status).toBe(notificationStatuses.amend);
    const amendedFulfilments = await notificationApi.getNotificationFulfilments(id);
    expect(amendedFulfilments.status).toBe(notificationStatuses.amend);

    const cancelled = await notificationApi.cancelAmendNotification(id);
    expect(cancelled.status).toBe(notificationStatuses.submittedActionRequired);

    const firstCopy = await notificationApi.copyNotification(id, cancelled.concurrencyToken);
    journeyContext.recordReferenceNumber(firstCopy.referenceNumber);
    const secondCopy = await notificationApi.copyNotification(id, cancelled.concurrencyToken);
    journeyContext.recordReferenceNumber(secondCopy.referenceNumber);
    expect(firstCopy.referenceNumber).not.toBe(id);
    expect(secondCopy.referenceNumber).not.toBe(firstCopy.referenceNumber);
    expect(firstCopy.status).toBe(notificationStatuses.draft);
    expect(secondCopy.status).toBe(notificationStatuses.draft);

    const deleted = await notificationApi.softDeleteNotification(id);
    expect(deleted.status).toBe(notificationStatuses.deleted);
    const repeatDelete = await notificationApi.softDeleteNotification(id);
    expect(repeatDelete.status).toBe(notificationStatuses.deleted);
  });

  test('renders a submitted notification read-only and opens an amendment at the review page', async ({
    animalsJourney,
    journeyContext,
    pages,
    animalsPages,
    animalsNotificationActions,
  }) => {
    test.slow();
    await animalsJourney.submitNotification(MANDATORY_ANSWERS_WITH_ITAHC);
    await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);

    await expect(animalsPages.notificationView.submittedHeader.reference).toHaveText(journeyContext.referenceNumber);
    await expect(animalsPages.notificationView.statusTag).toHaveText('Submitted');
    await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);
    await animalsNotificationActions.amendNotification(journeyContext.referenceNumber);
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
  });

  test("Back from a submitted notification's view opens the notification list", async ({
    animalsJourney,
    journeyContext,
    animalsPages,
  }) => {
    test.slow();
    await animalsJourney.submitNotification(MANDATORY_ANSWERS_WITH_ITAHC);

    await animalsPages.dashboard.open();
    await animalsPages.dashboard.searchForReference(journeyContext.referenceNumber);
    await animalsPages.dashboard.view(journeyContext.referenceNumber).click();
    await expect(animalsPages.notificationView.submittedHeader.reference).toHaveText(journeyContext.referenceNumber);
    await animalsPages.notificationView.linkBack.click();
    await expect(animalsPages.dashboard.heading).toBeVisible();
  });

  test('Back from an amendment review opened by Amend on the dashboard opens the dashboard', async ({
    animalsJourney,
    journeyContext,
    animalsPages,
    animalsNotificationActions,
  }) => {
    test.slow();
    await animalsJourney.submitNotification(MANDATORY_ANSWERS_WITH_ITAHC);

    await animalsNotificationActions.amendNotification(journeyContext.referenceNumber);
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await animalsPages.notificationView.linkBack.click();
    await expect(animalsPages.dashboard.heading).toBeVisible();
  });
});

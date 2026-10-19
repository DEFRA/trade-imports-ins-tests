import { test, expect } from '@fixtures';
import { notificationFulfilmentsStatuses } from '@domain/animals/models/api/notification-fulfilments';
import { notificationStatuses } from '@domain/animals/models/api/notification';

test.describe('Notification lifecycle', { tag: '@compose' }, () => {
  test('creates, submits, amends, cancels, copies and soft-deletes a notification; fulfilment view reflects each transition; each copy gets its own reference number', async ({
    notificationApi,
  }) => {
    const notification = await notificationApi.createNotification({ fulfilments: [] });
    const id = notification.referenceNumber;
    expect(notification.status).toBe(notificationStatuses.draft);

    const initial = await notificationApi.getNotificationFulfilments(id);
    expect(initial.referenceNumber).toBe(id);
    expect(initial.status).toBe(notificationFulfilmentsStatuses.draft);
    expect(initial.fulfilments).toEqual([]);

    const submitted = await notificationApi.submitNotification(id, notification.concurrencyToken);
    expect(submitted.status).toBe(notificationStatuses.submitted);
    const submittedFulfilments = await notificationApi.getNotificationFulfilments(id);
    expect(submittedFulfilments.status).toBe(notificationFulfilmentsStatuses.submitted);

    const amended = await notificationApi.amendNotification(id);
    expect(amended.status).toBe(notificationStatuses.amend);
    const amendedFulfilments = await notificationApi.getNotificationFulfilments(id);
    expect(amendedFulfilments.status).toBe(notificationFulfilmentsStatuses.amend);

    const cancelled = await notificationApi.cancelAmendNotification(id);
    expect(cancelled.status).toBe(notificationStatuses.submitted);

    const firstCopy = await notificationApi.copyNotification(id, cancelled.concurrencyToken);
    const secondCopy = await notificationApi.copyNotification(id, cancelled.concurrencyToken);
    expect(firstCopy.referenceNumber).not.toBe(id);
    expect(secondCopy.referenceNumber).not.toBe(firstCopy.referenceNumber);
    expect(firstCopy.status).toBe(notificationStatuses.draft);
    expect(secondCopy.status).toBe(notificationStatuses.draft);

    const deleted = await notificationApi.softDeleteNotification(id);
    expect(deleted.status).toBe(notificationStatuses.deleted);
    const repeatDelete = await notificationApi.softDeleteNotification(id);
    expect(repeatDelete.status).toBe(notificationStatuses.deleted);
  });

  test('renders a submitted notification read-only and re-enters an amendment at Overview', async ({
    animalsJourney,
    journeyContext,
    pages,
    animalsPages,
    animalsNotificationActions,
  }) => {
    test.slow();
    await animalsJourney.submitNotification();
    await animalsNotificationActions.toNotificationView(journeyContext.journeyId);

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);

    await animalsNotificationActions.amendNotification(journeyContext.journeyId);
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.statusTag).toHaveText('Amend');
  });
});

import { test, expect } from '@fixtures';
import { notificationFulfilmentsStatuses } from '@domain/models/api/notification-fulfilments';
import { notificationStatuses } from '@domain/models/api/notification';

test.describe('Notification lifecycle', { tag: ['@compose', '@integration'] }, () => {
  test('creates, submits, amends, cancels, copies and soft-deletes a notification; fulfilment view reflects each transition; copy no longer dedupes', async ({
    notificationApi,
  }) => {
    // Create the notification. Backend mints the reference number and returns
    // the notification entity carrying the empty fulfilments payload.
    const notification = await notificationApi.createNotification({ fulfilments: [] });
    const id = notification.referenceNumber;
    expect(notification.status).toBe(notificationStatuses.draft);

    // Fulfilment-view read reflects the same notification under a shape-specialised projection.
    const initial = await notificationApi.getNotificationFulfilments(id);
    expect(initial.referenceNumber).toBe(id);
    expect(initial.status).toBe(notificationFulfilmentsStatuses.draft);
    expect(initial.fulfilments).toEqual([]);

    // Submit.
    const submitted = await notificationApi.submitNotification(id);
    expect(submitted.status).toBe(notificationStatuses.submitted);
    const submittedFulfilments = await notificationApi.getNotificationFulfilments(id);
    expect(submittedFulfilments.status).toBe(notificationFulfilmentsStatuses.submitted);

    // Amend.
    const amended = await notificationApi.amendNotification(id);
    expect(amended.status).toBe(notificationStatuses.amend);
    const amendedFulfilments = await notificationApi.getNotificationFulfilments(id);
    expect(amendedFulfilments.status).toBe(notificationFulfilmentsStatuses.amend);

    // Cancel-amend.
    const cancelled = await notificationApi.cancelAmendNotification(id);
    expect(cancelled.status).toBe(notificationStatuses.submitted);

    // Copy no longer dedupes — two calls produce two distinct copies.
    // Copy is a WYSIWYG operation post-EUDPA-314, so the caller passes the
    // source's current concurrencyToken; copy does not mutate the source, so
    // both calls carry the same token.
    const firstCopy = await notificationApi.copyNotification(id, cancelled.concurrencyToken);
    const secondCopy = await notificationApi.copyNotification(id, cancelled.concurrencyToken);
    expect(firstCopy.referenceNumber).not.toBe(id);
    expect(secondCopy.referenceNumber).not.toBe(firstCopy.referenceNumber);
    expect(firstCopy.status).toBe(notificationStatuses.draft);
    expect(secondCopy.status).toBe(notificationStatuses.draft);

    // Soft-delete is idempotent — repeated calls return the DELETED notification unchanged.
    const deleted = await notificationApi.softDeleteNotification(id);
    expect(deleted.status).toBe(notificationStatuses.deleted);
    const repeatDelete = await notificationApi.softDeleteNotification(id);
    expect(repeatDelete.status).toBe(notificationStatuses.deleted);
  });

  test('renders a submitted notification read-only and re-enters an amendment at Overview', async ({
    journey,
    journeyContext,
    pages,
    notificationActions,
  }) => {
    await journey.submitNotification();
    await notificationActions.toNotificationView(journeyContext.journeyId);

    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);

    await notificationActions.amendNotification(journeyContext.journeyId);
    await expect(pages.overview.heading).toBeVisible();
    await expect(pages.overview.journeyStrip).toContainText('Amending');
  });
});

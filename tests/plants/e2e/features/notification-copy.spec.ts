import { test, expect } from '@fixtures';

test.describe('Notification copy', () => {
  test('offers Copy as new on a submitted notification and opens a new draft at its overview', async ({
    plantsJourney,
    plantsNotificationActions,
    plantsPages,
    addressBookApi,
  }) => {
    test.slow();
    const { reference } = await plantsJourney.completeNotification(addressBookApi);
    await plantsJourney.submitFromReview();
    await plantsNotificationActions.toNotificationView(reference);

    await expect(plantsPages.notificationView.viewHeader.actions).toHaveText([
      'Amend this notification',
      'Copy as new',
      'Delete notification',
    ]);

    const copiedReferenceNumber = await plantsNotificationActions.copyFromNotificationView(reference);

    await expect(plantsPages.overview.heading).toBeVisible();
    expect(copiedReferenceNumber).not.toEqual(reference);
  });

  test('offers Copy as new and Delete notification on the copy, a draft', async ({
    plantsJourney,
    plantsNotificationActions,
    plantsPages,
    addressBookApi,
  }) => {
    test.slow();
    const { reference } = await plantsJourney.completeNotification(addressBookApi);
    await plantsJourney.submitFromReview();

    const copiedReferenceNumber = await plantsNotificationActions.copyFromNotificationView(reference);

    await plantsNotificationActions.toNotificationView(copiedReferenceNumber);
    await expect(plantsPages.notificationView.viewHeader.actions).toHaveText(['Copy as new', 'Delete notification']);
  });
});

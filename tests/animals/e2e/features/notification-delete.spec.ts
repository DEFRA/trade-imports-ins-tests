import { test, expect } from '@fixtures';

test.describe('Notification delete', { tag: '@duplicated-in-frontend' }, () => {
  test('deletes a draft notification', async ({ animalsJourney, animalsPages, journeyContext }) => {
    test.slow();
    await animalsJourney.startNotification();
    const { referenceNumber } = journeyContext;

    await animalsPages.deleteNotification.open(referenceNumber);
    await animalsPages.deleteNotification.heading.waitFor();
    await animalsPages.deleteNotification.btnConfirm.click();
    await expect(animalsPages.dashboard.deletedBanner).toBeVisible();
  });

  test(
    'deletes the notification and removes it from the dashboard',
    { tag: '@smoke' },
    async ({ animalsPages, animalsSeededJourney, animalsNotificationActions }) => {
      const referenceNumber = await animalsSeededJourney.createSubmittedNotification();

      await animalsNotificationActions.deleteNotification(referenceNumber);
      await animalsPages.dashboard.open();
      await animalsPages.dashboard.searchForReference(referenceNumber);
      await expect(animalsPages.dashboard.notificationCards).toHaveCount(0);
    },
  );
});

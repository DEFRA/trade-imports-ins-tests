import { SET_BASES } from '@page-objects/base/sets';

import { test, expect } from '@fixtures';

test.describe('Notification delete', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('deletes a draft notification', async ({ journey, journeyContext, pages }) => {
    test.slow();
    await journey.startNotification();
    const { journeyId } = journeyContext;

    await pages.page.goto(`${SET_BASES.liveAnimals}/notifications/${journeyId}/delete`);
    await pages.page.getByRole('heading', { name: 'Delete this notification?' }).waitFor();
    await pages.page.getByRole('button', { name: 'Yes, delete notification' }).click();
    await expect(pages.page.getByText('The notification has been deleted.')).toBeVisible();
  });

  test(
    'deletes the notification and removes it from the dashboard',
    { tag: '@smoke' },
    async ({ pages, seededJourney, notificationActions }) => {
      const referenceNumber = await seededJourney.createSubmittedNotification();

      await notificationActions.deleteNotification(referenceNumber);
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    },
  );
});

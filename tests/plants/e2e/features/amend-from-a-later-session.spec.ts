import { test, expect } from '@fixtures';
import { PlantsNotificationActions } from '@flows/plants/notification-actions';

test.describe('Dashboard actions in a later browser session', () => {
  test('amends a notification that an earlier browser session submitted', async ({ submitPlantsNotificationThenOpenFreshSession }) => {
    test.slow();
    const { reference, freshPages, freshSharedPages } = await submitPlantsNotificationThenOpenFreshSession();

    await new PlantsNotificationActions(freshPages, freshSharedPages).amendNotification(reference);

    await expect(freshPages.overview.statusTag).toHaveText('Amend');
    await expect(freshPages.overview.notificationReference).toHaveText(reference);
  });

  test('tells the user a deleted notification could not be amended', async ({
    submitPlantsNotificationThenOpenFreshSession,
    plantsNotificationActions,
  }) => {
    test.slow();
    const { reference, freshPages } = await submitPlantsNotificationThenOpenFreshSession();
    await freshPages.dashboard.open();
    await freshPages.dashboard.searchForReference(reference);
    await expect(freshPages.dashboard.amend(reference)).toBeVisible();
    await plantsNotificationActions.deleteNotification(reference);

    await freshPages.dashboard.amend(reference).click();

    await expect(freshPages.dashboard.importantBanner).toContainText(freshPages.dashboard.amendRefusedMessage);
  });
});

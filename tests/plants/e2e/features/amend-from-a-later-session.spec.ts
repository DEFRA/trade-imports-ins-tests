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

  test('choosing Amend on a card whose notification has since been deleted opens the notification list, with no notification banner and the notification no longer listed', async ({
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

    await expect(freshPages.dashboard.heading).toBeVisible();
    await expect(freshPages.dashboard.importantBanner).toHaveCount(0);
    await freshPages.dashboard.searchForReference(reference);
    await expect(freshPages.dashboard.notificationCard(reference)).toHaveCount(0);
  });
});

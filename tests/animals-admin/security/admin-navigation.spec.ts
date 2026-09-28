import { test, expect } from '@fixtures';

test.describe('Security scan (admin)', { tag: '@active' }, () => {
  test('routes admin navigation through the ZAP proxy', async ({ animalsSeededJourney, animalsAdminNavigation, animalsAdminPages }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();

    await animalsAdminNavigation.toAdminDashboard();
    await expect(animalsAdminPages.dashboard.heading).toBeVisible();

    await animalsAdminNavigation.toNotifications();
    await expect(animalsAdminPages.notifications.heading).toBeVisible();

    await animalsAdminNavigation.toOutboxEvents(referenceNumber);
    await expect(animalsAdminPages.outboxEvents.heading).toBeVisible();
  });
});

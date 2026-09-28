import { test, expect } from '@fixtures';

test.describe('Security scan (admin)', { tag: '@active' }, () => {
  test('routes admin navigation through the ZAP proxy', async ({ seededJourney, adminNavigation, animalsAdminPages }) => {
    test.slow();
    const referenceNumber = await seededJourney.createSubmittedNotification();

    await adminNavigation.toAdminDashboard();
    await expect(animalsAdminPages.dashboard.heading).toBeVisible();

    await adminNavigation.toNotifications();
    await expect(animalsAdminPages.notifications.heading).toBeVisible();

    await adminNavigation.toOutboxEvents(referenceNumber);
    await expect(animalsAdminPages.outboxEvents.heading).toBeVisible();
  });
});

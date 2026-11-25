import { test, expect } from '@fixtures';

test.describe('Admin service', () => {
  test.beforeEach(async ({ animalsAdminNavigation }) => {
    await animalsAdminNavigation.toAdminDashboard();
  });

  test('lands on the admin dashboard', { tag: '@smoke' }, async ({ pages, animalsAdminPages }) => {
    await expect(pages.page).toHaveURL(animalsAdminPages.dashboard.expectedUrl);
    await expect(animalsAdminPages.dashboard.heading).toBeVisible();
  });

  test('allows navigating to notifications area', async ({ pages, animalsAdminPages }) => {
    await animalsAdminPages.dashboard.btnNotifications.click();
    await expect(pages.page).toHaveURL(animalsAdminPages.notifications.expectedUrl);
    await expect(animalsAdminPages.notifications.heading).toBeVisible();
  });
});

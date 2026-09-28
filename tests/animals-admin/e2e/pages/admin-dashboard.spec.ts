import { test, expect } from '@fixtures';

test.describe('Admin service', () => {
  test.beforeEach(async ({ adminNavigation }) => {
    await adminNavigation.toAdminDashboard();
  });

  test('lands on the admin dashboard', { tag: '@smoke' }, async ({ pages }) => {
    await expect(pages.page).toHaveURL(pages.adminDashboard.expectedUrl);
    await expect(pages.adminDashboard.heading).toBeVisible();
  });

  test('allows navigating to notifications area', async ({ pages }) => {
    await pages.adminDashboard.btnNotifications.click();
    await expect(pages.page).toHaveURL(pages.adminNotifications.expectedUrl);
    await expect(pages.adminNotifications.heading).toBeVisible();
  });
});

import { test, expect } from '@fixtures';

test.describe('Dashboard pagination', { tag: '@integration' }, () => {
  test('uses GOV.UK pagination and reports the result range', async ({ journey, pages }) => {
    await journey.toNotificationDashboard();
    for (let index = 0; index < 26; index += 1) {
      await pages.notificationDashboard.btnCreateNewNotification.click();
      await pages.originOfImport.heading.waitFor();
      await pages.notificationDashboard.open(false);
    }

    await expect(pages.notificationDashboard.totalResults).toHaveText(/^Showing 1 to 25 of \d+ Results$/);
    await expect(pages.notificationDashboard.linkNextPage).toBeVisible();

    const firstPageReference = await pages.notificationDashboard.notificationCards.first().getByRole('heading').textContent();
    await pages.notificationDashboard.linkNextPage.click();
    await expect(pages.page).toHaveURL(/[?&]page=2(?:&|$)/);
    await expect(pages.notificationDashboard.linkPreviousPage).toBeVisible();
    await expect(pages.notificationDashboard.totalResults).toHaveText(/^Showing 26(?: to \d+)? of \d+ Results$/);

    const secondPageReference = await pages.notificationDashboard.notificationCards.first().getByRole('heading').textContent();
    expect(secondPageReference).not.toBe(firstPageReference);
  });
});

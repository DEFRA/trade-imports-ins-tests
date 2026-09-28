import { test, expect } from '@fixtures';

test.describe('Dashboard pagination', { tag: '@integration' }, () => {
  test('uses GOV.UK pagination and reports the result range', async ({ animalsJourney, pages, animalsPages }) => {
    await animalsJourney.toNotificationDashboard();
    for (let index = 0; index < 26; index += 1) {
      await animalsPages.dashboard.btnCreateNewNotification.click();
      await animalsPages.originOfImport.heading.waitFor();
      await animalsPages.dashboard.open(false);
    }

    await expect(animalsPages.dashboard.totalResults).toHaveText(/^Showing 1 to 25 of \d+ Results$/);
    await expect(animalsPages.dashboard.linkNextPage).toBeVisible();

    const firstPageReference = await animalsPages.dashboard.notificationCards.first().getByRole('heading').textContent();
    await animalsPages.dashboard.linkNextPage.click();
    await expect(pages.page).toHaveURL(/[?&]page=2(?:&|$)/);
    await expect(animalsPages.dashboard.linkPreviousPage).toBeVisible();
    await expect(animalsPages.dashboard.totalResults).toHaveText(/^Showing 26(?: to \d+)? of \d+ Results$/);

    const secondPageReference = await animalsPages.dashboard.notificationCards.first().getByRole('heading').textContent();
    expect(secondPageReference).not.toBe(firstPageReference);
  });
});

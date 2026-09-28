import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/constants/sort-by-values';

test.describe('Security scan (frontend, dashboard parameters)', { tag: '@active' }, () => {
  test('routes the dashboard query parameters through the ZAP proxy', async ({ journey, pages }) => {
    // activeScan only fuzzes parameters it has observed, so the dashboard's
    // server-side search, sort and paging are unattackable until a request
    // carrying each one reaches the proxy. The submitted journeys elsewhere in
    // this suite only ever land on the unparameterised dashboard.
    const journeyId = await journey.startNotification();

    await journey.toNotificationDashboard();
    await pages.notificationDashboard.searchForReference(journeyId);
    await expect(pages.notificationDashboard.notificationCard(journeyId)).toBeVisible();

    await pages.notificationDashboard.openDashboardPage(1);
    await pages.notificationDashboard.sortBy(sortByValues.dateCreatedOldestToNewest);
    await pages.notificationDashboard.waitForNotificationList();

    await pages.notificationDashboard.goToLastPage();
    await expect(pages.notificationDashboard.heading).toBeVisible();
  });
});

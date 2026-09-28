import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/animals/constants/sort-by-values';

test.describe('Security scan (frontend, dashboard parameters)', { tag: '@active' }, () => {
  test('routes the dashboard query parameters through the ZAP proxy', async ({ animalsJourney, animalsPages }) => {
    // activeScan only fuzzes parameters it has observed, so the dashboard's
    // server-side search, sort and paging are unattackable until a request
    // carrying each one reaches the proxy. The submitted journeys elsewhere in
    // this suite only ever land on the unparameterised dashboard.
    const journeyId = await animalsJourney.startNotification();

    await animalsJourney.toNotificationDashboard();
    await animalsPages.dashboard.searchForReference(journeyId);
    await expect(animalsPages.dashboard.notificationCard(journeyId)).toBeVisible();

    await animalsPages.dashboard.openDashboardPage(1);
    await animalsPages.dashboard.sortBy(sortByValues.dateCreatedOldestToNewest);
    await animalsPages.dashboard.waitForNotificationList();

    await animalsPages.dashboard.goToLastPage();
    await expect(animalsPages.dashboard.heading).toBeVisible();
  });
});

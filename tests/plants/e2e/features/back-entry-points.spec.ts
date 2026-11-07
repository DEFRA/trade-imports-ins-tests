import { test, expect } from '@fixtures';

test.describe('Back on the review page by where the trader came from', () => {
  test('after an amendment is cancelled the review opens the dashboard', async ({
    plantsPages,
    plantsJourney,
    plantsNotificationActions,
    addressBookApi,
  }) => {
    const reference = await plantsNotificationActions.amendCompletedNotification(plantsJourney, addressBookApi);
    await plantsNotificationActions.cancelAmend(reference);

    await plantsPages.notificationView.linkBack.click();

    await expect(plantsPages.dashboard.heading).toBeVisible();
  });

  test('opened in a fresh browser context on a trail address, the review keeps its Back link', async ({
    browser,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference } = await plantsJourney.completeNotification(addressBookApi);

    const backHref = await plantsPages.notificationView.backHrefInFreshContext(browser, reference, '?from=overview');

    expect(backHref).toMatch(plantsPages.overview.expectedUrlPattern(reference));
  });
});

import { test, expect } from '@fixtures';

test.describe('Back on the review page by where the trader came from', () => {
  test('after an amendment is cancelled the review opens the dashboard', async ({
    animalsSeededJourney,
    animalsNotificationActions,
    animalsPages,
  }) => {
    test.slow();
    const reference = await animalsSeededJourney.createSubmittedNotification();
    await animalsNotificationActions.amendNotification(reference);
    await animalsNotificationActions.cancelAmend(reference);

    await animalsPages.notificationView.linkBack.click();

    await expect(animalsPages.dashboard.heading).toBeVisible();
  });

  test('opened in a fresh browser context on a trail address, the review keeps its Back link', async ({
    browser,
    animalsSeededJourney,
    animalsPages,
  }) => {
    test.slow();
    const reference = await animalsSeededJourney.createDraftNotification();
    await animalsPages.notificationView.open(reference);

    const backHref = await animalsPages.notificationView.backHrefInFreshContext(browser, reference, '?from=overview');

    expect(backHref).toMatch(animalsPages.overview.expectedUrlPattern(reference));
  });
});

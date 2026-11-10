import { test, expect } from '@fixtures';
import { TRAIL_START } from '@page-objects/shared/base-page';

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

  test('opened in a new session holding only the sign-in cookie on the overview trail, the review links Back to the overview', async ({
    completePlantsNotificationThenOpenFreshSession,
  }) => {
    const { reference, freshPages } = await completePlantsNotificationThenOpenFreshSession();

    await freshPages.notificationView.openOnTrail(reference, [TRAIL_START.overview]);

    await expect(freshPages.notificationView.linkBack).toHaveAttribute('href', freshPages.overview.expectedUrl(reference));
  });
});

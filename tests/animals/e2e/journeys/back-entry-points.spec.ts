import { test, expect } from '@fixtures';
import { TRAIL_START } from '@page-objects/shared/base-page';

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

  test('opened in a new session holding only the sign-in cookie on the overview trail, the review links Back to the overview', async ({
    completeAnimalsNotificationThenOpenFreshSession,
  }) => {
    test.slow();
    const { reference, freshPages } = await completeAnimalsNotificationThenOpenFreshSession();

    await freshPages.notificationView.openOnTrail(reference, [TRAIL_START.overview]);

    await expect(freshPages.notificationView.linkBack).toHaveAttribute('href', freshPages.overview.expectedUrl(reference));
  });
});

import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, lifecycle)', { tag: '@active' }, () => {
  test('routes the post-submission actions through the ZAP proxy', async ({
    animalsJourney,
    journeyContext,
    animalsPages,
    animalsNotificationActions,
  }) => {
    test.slow();
    await animalsJourney.submitNotification();
    const { journeyId } = journeyContext;

    await animalsNotificationActions.amendNotification(journeyId);
    await expect(animalsPages.overview.statusTag).toHaveText('Amend');

    await animalsNotificationActions.copyNotification(journeyId);
    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('routes cancelling an amendment and deleting through the ZAP proxy', async ({
    animalsJourney,
    journeyContext,
    animalsPages,
    animalsNotificationActions,
  }) => {
    test.slow();
    await animalsJourney.submitNotification();
    const { journeyId } = journeyContext;

    await animalsNotificationActions.amendNotification(journeyId);
    await animalsNotificationActions.cancelAmend(journeyId);
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');

    await animalsNotificationActions.deleteNotification(journeyId);
  });
});

import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, lifecycle)', { tag: '@active' }, () => {
  test('routes the post-submission actions through the ZAP proxy', async ({
    journey,
    journeyContext,
    animalsPages,
    notificationActions,
  }) => {
    test.slow();
    await journey.submitNotification();
    const { journeyId } = journeyContext;

    await notificationActions.amendNotification(journeyId);
    await expect(animalsPages.overview.journeyStrip).toContainText('Amending');

    await notificationActions.copyNotification(journeyId);
    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('routes cancelling an amendment and deleting through the ZAP proxy', async ({
    journey,
    journeyContext,
    animalsPages,
    notificationActions,
  }) => {
    test.slow();
    await journey.submitNotification();
    const { journeyId } = journeyContext;

    await notificationActions.amendNotification(journeyId);
    await notificationActions.cancelAmend(journeyId);
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');

    await notificationActions.deleteNotification(journeyId);
  });
});

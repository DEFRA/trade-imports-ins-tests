import { test, expect } from '@fixtures';
import { MANDATORY_ANSWERS_WITH_ITAHC } from '@domain/animals/constants/journey-options';

test.describe('Security scan (frontend, lifecycle)', { tag: '@active' }, () => {
  test('routes the post-submission actions through the ZAP proxy', async ({
    animalsJourney,
    journeyContext,
    animalsPages,
    animalsNotificationActions,
  }) => {
    test.slow();
    await animalsJourney.submitNotification();
    const { referenceNumber } = journeyContext;

    await animalsNotificationActions.amendNotification(referenceNumber);
    await expect(animalsPages.overview.statusTag).toHaveText('Amend');

    await animalsNotificationActions.copyNotification(referenceNumber);
    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('routes cancelling an amendment and deleting through the ZAP proxy', async ({
    animalsJourney,
    journeyContext,
    animalsPages,
    animalsNotificationActions,
  }) => {
    test.slow();
    await animalsJourney.submitNotification(MANDATORY_ANSWERS_WITH_ITAHC);
    const { referenceNumber } = journeyContext;

    await animalsNotificationActions.amendNotification(referenceNumber);
    await animalsNotificationActions.cancelAmend(referenceNumber);
    await expect(animalsPages.notificationView.viewHeader.statusTag).toHaveText('Submitted');

    await animalsNotificationActions.deleteNotification(referenceNumber);
  });
});

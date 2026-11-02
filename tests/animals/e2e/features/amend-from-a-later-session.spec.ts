import { test, expect } from '@fixtures';
import { REFERENCE_NUMBER_PATTERN, WHOLE_REFERENCE_NUMBER_PATTERN } from '@domain/animals/constants/reference-number-patterns';
import { AnimalsNotificationActions } from '@flows/animals/notification-actions';

test.describe('Dashboard actions in a later browser session', () => {
  test('amends a notification that an earlier browser session submitted', async ({
    submitAnimalsNotificationThenOpenFreshSession,
    journeyContext,
  }) => {
    test.slow();
    const { reference, freshPages, freshSharedPages } = await submitAnimalsNotificationThenOpenFreshSession();

    await new AnimalsNotificationActions(freshPages, freshSharedPages, journeyContext).amendNotification(reference);

    await expect(freshPages.overview.statusTag).toHaveText('Amend');
    await expect(freshPages.overview.journeyStrip).toContainText(reference);
  });

  test('copies a notification that an earlier browser session submitted into a new draft and leaves the original submitted', async ({
    submitAnimalsNotificationThenOpenFreshSession,
    journeyContext,
  }) => {
    test.slow();
    const { reference, freshPages, freshSharedPages } = await submitAnimalsNotificationThenOpenFreshSession();

    await new AnimalsNotificationActions(freshPages, freshSharedPages, journeyContext).copyNotification(reference);

    await expect(freshPages.overview.statusTag).toHaveText('Draft');
    const copiedReference = (await freshPages.overview.journeyStrip.textContent())?.match(REFERENCE_NUMBER_PATTERN)?.[0];
    expect(copiedReference).toMatch(WHOLE_REFERENCE_NUMBER_PATTERN);
    expect(copiedReference).not.toEqual(reference);
    await freshPages.dashboard.open();
    await freshPages.dashboard.searchForReference(reference);
    await expect(freshPages.dashboard.cardStatusTag(reference)).toHaveText('Submitted');
  });

  test('tells the user a deleted notification could not be amended', async ({
    submitAnimalsNotificationThenOpenFreshSession,
    animalsNotificationActions,
  }) => {
    test.slow();
    const { reference, freshPages } = await submitAnimalsNotificationThenOpenFreshSession();
    await freshPages.dashboard.open();
    await freshPages.dashboard.searchForReference(reference);
    await expect(freshPages.dashboard.amend(reference)).toBeVisible();
    await animalsNotificationActions.deleteNotification(reference);

    await freshPages.dashboard.amend(reference).click();

    await expect(freshPages.dashboard.importantBanner).toContainText(freshPages.dashboard.amendRefusedMessage);
  });
});

import { test, expect, pinDateText, pinText } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Review (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
    await animalsSeededJourney.createDraftNotification();
    await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
  });

  test('shows a ready draft from the first section to the Contact address card and the Continue button at desktop width', async ({
    page,
    animalsPages,
  }) => {
    await pinDateText(
      animalsPages.notificationView.summaryValue(
        animalsPages.notificationView.summaryCard('Arrival details'),
        'Arrival date at destination',
      ),
    );
    await expect(animalsPages.notificationView.summaryCard('Contact address')).toBeVisible();
    await expect(animalsPages.notificationView.continueButton).toBeVisible();
    const { viewHeader } = animalsPages.notificationView;
    await pinText(viewHeader.reference, 'GBN-AG-26-AAAAAA');
    await pinText(viewHeader.notificationReferenceValue, 'GBN-AG-26-AAAAAA');
    await pinText(viewHeader.dateCreated, 'Date created: 1 January 2026');

    await expect(page).toHaveScreenshot('review-desktop.png', { fullPage: true });
  });
});

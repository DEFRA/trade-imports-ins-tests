import { test, expect, pinDateText, pinDraftViewHeader } from '@fixtures/visual';

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
      animalsPages.notificationView.summaryValue(animalsPages.notificationView.arrivalDetailsCard, 'Arrival date at port of entry'),
    );
    await expect(animalsPages.notificationView.contactAddressCard).toBeVisible();
    await expect(animalsPages.notificationView.continueButton).toBeVisible();
    const { viewHeader } = animalsPages.notificationView;
    await pinDraftViewHeader(viewHeader);

    await expect(page).toHaveScreenshot('review-desktop.png', { fullPage: true });
  });
});

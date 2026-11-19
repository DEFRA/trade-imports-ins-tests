import { test, expect } from '@fixtures';
import { AMENDED_INTERNAL_REFERENCE } from '@domain/animals/constants/origin-page';
import { resubmitHeadingText, reviewHeadingText } from '@page-objects/animals/notification-view-page';

test.describe('Amendment review title', () => {
  test('opens headed and titled as a review, then as re-submitting once an answer changes', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
    animalsNotificationActions,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();

    await animalsPages.notificationView.open(reference);
    await expect(animalsPages.notificationView.heading).toHaveText(reviewHeadingText);
    await expect(pages.page).toHaveTitle(new RegExp(`^${reviewHeadingText}`));
    await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);

    await animalsNotificationActions.changeInternalReferenceOnAmendment(reference, AMENDED_INTERNAL_REFERENCE);

    await expect(animalsPages.notificationView.heading).toHaveText(resubmitHeadingText);
    await expect(pages.page).toHaveTitle(new RegExp(`^${resubmitHeadingText}`));
  });

  test.describe('after a document is uploaded', { tag: '@compose' }, () => {
    test('keeps the review heading when only a document is added', async ({
      pages,
      animalsPages,
      animalsJourney,
      animalsSeededJourney,
    }) => {
      test.slow();
      const reference = await animalsSeededJourney.createAmendNotification();
      await animalsPages.accompanyingDocuments.open(reference);

      await animalsJourney.uploadScannedDocument();
      await animalsPages.notificationView.open(reference);

      await expect(animalsPages.notificationView.heading).toHaveText(reviewHeadingText);
      await expect(pages.page).toHaveTitle(new RegExp(`^${reviewHeadingText}`));
    });
  });
});

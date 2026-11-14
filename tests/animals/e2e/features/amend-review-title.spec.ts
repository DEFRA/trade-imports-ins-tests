import { test, expect } from '@fixtures';
import { AMENDED_REFERENCE } from '@domain/animals/constants/origin-page';

test.describe('Amendment review title', () => {
  test('opens headed and titled as a review, then as re-submitting once an answer changes', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
    animalsNotificationActions,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();

    await animalsPages.notificationView.open(reference);
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveTitle(/^Review your notification/);
    await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);

    await animalsNotificationActions.changeInternalReferenceOnAmendment(reference, AMENDED_REFERENCE);

    await expect(animalsPages.notificationView.resubmittingHeading).toBeVisible();
    await expect(pages.page).toHaveTitle(/^Review before re-submitting/);
  });

  test.describe('with the real uploader', { tag: '@compose' }, () => {
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

      await expect(animalsPages.notificationView.heading).toBeVisible();
      await expect(pages.page).toHaveTitle(/^Review your notification/);
    });
  });
});

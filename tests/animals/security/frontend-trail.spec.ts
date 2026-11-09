import { test, expect } from '@fixtures';
import { TRAIL_START } from '@page-objects/shared/base-page';
import { expectOpenFromReview } from '@page-objects/shared/journey-checks';

test.describe('Security scan (frontend, trail)', { tag: '@active' }, () => {
  test('routes the trail query parameter of a review Change link through the ZAP proxy', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();
    await animalsJourney.toReview();
    const reference = animalsPages.notificationView.referenceNumberFromUrl();
    await animalsPages.notificationView.openOnTrail(reference, [TRAIL_START.overview]);

    await animalsPages.notificationView.changeLink('Change import details').click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expectOpenFromReview(pages.page, animalsPages.originOfImport, reference, animalsPages.notificationView.slug, [
      TRAIL_START.overview,
    ]);

    await animalsPages.originOfImport.country.choose('Belgium');
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.commoditySelection.heading).toBeVisible();
  });
});

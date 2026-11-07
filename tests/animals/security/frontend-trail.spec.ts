import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, trail)', { tag: '@active' }, () => {
  test('routes the trail query parameter of a review Change link through the ZAP proxy', async ({ animalsJourney, animalsPages }) => {
    test.slow();
    await animalsJourney.toReview();

    await animalsPages.notificationView.changeLink('Change import details').click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await animalsPages.originOfImport.expectReviewIsLastOnTrail();

    await animalsPages.originOfImport.country.choose('Belgium');
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.commoditySelection.heading).toBeVisible();
  });
});

import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, change context)', { tag: '@active' }, () => {
  test('routes the change-context query parameter through the ZAP proxy', async ({ animalsJourney, pages, animalsPages }) => {
    test.slow();
    await animalsJourney.toReview();
    const reference = animalsPages.notificationView.referenceNumberFromUrl();

    await animalsPages.notificationView.changeLink('Change import details').click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(pages.page).toHaveURL(animalsPages.originOfImport.changeContextUrl(reference));
    await animalsPages.originOfImport.country.choose('Belgium');
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
  });
});

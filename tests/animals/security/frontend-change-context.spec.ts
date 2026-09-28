import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, change context)', { tag: '@active' }, () => {
  test('routes the change-context query parameter through the ZAP proxy', async ({ journey, pages, animalsPages }) => {
    test.slow();
    // ?change=1 is how Check Your Answers reaches pages already scanned
    // elsewhere in this suite — no other spec sends this parameter.
    await journey.toReview();

    await animalsPages.notificationView.changeLink('Change import details').click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
    await animalsPages.originOfImport.selectCountry('Belgium');
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
  });
});

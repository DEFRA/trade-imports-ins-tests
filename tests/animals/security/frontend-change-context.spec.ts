import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, change context)', { tag: '@active' }, () => {
  test('routes the change-context query parameter through the ZAP proxy', async ({ journey, pages }) => {
    test.slow();
    // ?change=1 is how Check Your Answers reaches pages already scanned
    // elsewhere in this suite — no other spec sends this parameter.
    await journey.toReview();

    await pages.notificationView.changeLink('Change import details').click();
    await expect(pages.originOfImport.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
    await pages.originOfImport.selectCountry('Belgium');
    await pages.originOfImport.saveAndContinue.click();
    await expect(pages.notificationView.heading).toBeVisible();
  });
});

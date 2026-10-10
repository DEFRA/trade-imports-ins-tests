import { test, expect } from '@fixtures';

test.describe('High-risk plants page titles', { tag: '@integration' }, () => {
  test('a journey page is titled page name, service name and GOV.UK, joined by hyphens', async ({ pages, plantsPages, plantsJourney }) => {
    // Given a started notification
    // When the trader is on the commodity-type page
    await plantsJourney.startNotification();
    await expect(plantsPages.commodityType.heading).toBeVisible();

    // Then the title names the page, then the service, then GOV.UK, with no pipe
    await expect(pages.page).toHaveTitle('What are you importing? - Import notification service - GOV.UK');
    await expect(pages.page).not.toHaveTitle(/\|/);
  });

  test('a page showing errors opens its title with Error:', async ({ pages, plantsPages, plantsJourney }) => {
    // Given a started notification on the commodity-type page
    await plantsJourney.startNotification();

    // When the trader saves without choosing anything
    await plantsPages.commodityType.btnSaveAndContinue.click();

    // Then the page shows errors and its whole title opens with the error prefix
    await expect(pages.page).toHaveTitle('Error: What are you importing? - Import notification service - GOV.UK');
  });
});

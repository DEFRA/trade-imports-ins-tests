import { test, expect } from '@fixtures';

test.describe('High-risk plants page titles', { tag: '@duplicated-in-frontend' }, () => {
  test('a journey page is titled page name, service name and GOV.UK, joined by hyphens', async ({ pages, plantsPages, plantsJourney }) => {
    await plantsJourney.startNotification();
    await expect(plantsPages.commodityType.heading).toBeVisible();

    await expect(pages.page).toHaveTitle('What are you importing? - Import notification service - GOV.UK');
  });

  test('a page showing errors opens its title with Error:', async ({ pages, plantsPages, plantsJourney }) => {
    await plantsJourney.startNotification();

    await plantsPages.commodityType.saveAndContinue.click();

    await expect(pages.page).toHaveTitle('Error: What are you importing? - Import notification service - GOV.UK');
  });
});

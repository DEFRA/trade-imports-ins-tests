import { POTATOES, SEED_POTATOES, potatoLine } from '@flows/plants/journey';

import { test, expect } from '@fixtures';

const FRANCE = 'France';

test.describe('Save and continue from Overview', () => {
  test('the commodities list keeps adds and removes on the list and its Continue opens origin', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine);
    await plantsPages.commodities.open(reference);

    await plantsPages.commodities.btnAddAnother.click();
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine);
    await expect(pages.page).toHaveURL(plantsPages.commodities.expectedUrlPattern(reference));
    await expect(plantsPages.commodities.lineRows).toHaveCount(2);

    await plantsPages.commodities.btnRemove(2).click();
    await expect(plantsPages.commodities.lineRows).toHaveCount(1);
    await expect(plantsPages.commodities.heading).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`/notifications/${reference}/commodities`));

    await plantsPages.commodities.saveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.origin.expectedUrlPattern(reference));
  });

  test('a task opened from its Overview row opens its own page, and Save and continue goes to the next page in the journey order', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference } = await plantsJourney.completeNotification(addressBookApi);
    await plantsPages.overview.open(reference);

    await plantsPages.overview.taskRowLink('Identification numbers').click();
    await expect(pages.page).toHaveURL(plantsPages.identificationNumbers.expectedUrlPattern(reference));

    await plantsPages.identificationNumbers.saveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.consignmentContactSelect.expectedUrlPattern(reference));
  });
});

test.describe('Save and continue to the next page', () => {
  test('a potato notification skips arrival status after origin and goes to arrival details', async ({ plantsPages, plantsJourney }) => {
    await plantsJourney.toOriginOfNewNotification(POTATOES);
    await plantsPages.origin.country.choose(FRANCE);

    await plantsPages.origin.saveAndContinue.click();

    await expect(plantsPages.arrivalDetails.heading).toBeVisible();
  });

  test('Save and continue on the commodities page in a fresh browser session goes on to origin', async ({
    savePlantsCommoditiesThenOpenFreshSession,
  }) => {
    const { reference, freshPages } = await savePlantsCommoditiesThenOpenFreshSession();

    await freshPages.commodities.open(reference);
    await freshPages.commodities.saveAndContinue.click();

    await expect(freshPages.origin.heading).toBeVisible();
  });

  test('contact address saved with nothing chosen goes to check your answers', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference } = await plantsJourney.completeNotification(addressBookApi, { contact: false });

    await plantsPages.consignmentContactSelect.open(reference);
    await plantsPages.consignmentContactSelect.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrlPattern(reference));
  });
});

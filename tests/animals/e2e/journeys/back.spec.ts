import { meansOfTransport } from '@domain/animals/constants/means-of-transport';

import { test, expect } from '@fixtures';

test.describe('Back on the review page', () => {
  test('after Continue from the addresses page it opens check your answers, whose Back opens Overview', async ({
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();
    await animalsJourney.walkToRolesAndAddressesWithoutCph();
    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    await animalsPages.notificationView.linkBack.click();
    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('opened from the Overview review button it opens Overview', async ({ animalsSeededJourney, animalsPages }) => {
    test.slow();
    const reference = await animalsSeededJourney.createDraftNotification();
    await animalsPages.overview.open(reference);

    await animalsPages.overview.reviewAndSubmitButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    await animalsPages.notificationView.linkBack.click();
    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('opened from a submitted notification dashboard card it opens the dashboard', async ({ animalsSeededJourney, animalsPages }) => {
    test.slow();
    const reference = await animalsSeededJourney.createSubmittedNotification();
    await animalsPages.dashboard.openAndSearchFor(reference);

    await animalsPages.dashboard.view(reference).click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    await animalsPages.notificationView.linkBack.click();
    await expect(animalsPages.dashboard.heading).toBeVisible();
  });

  test('opened by Amend on the dashboard it opens the dashboard, before and after a Change link round trip', async ({
    animalsSeededJourney,
    animalsPages,
  }) => {
    test.slow();
    const reference = await animalsSeededJourney.createSubmittedNotification();
    await animalsPages.dashboard.openAndSearchFor(reference);
    await animalsPages.dashboard.amend(reference).click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    await animalsPages.notificationView.changeLink('Change import details').click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await animalsPages.originOfImport.linkBack.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    await animalsPages.notificationView.linkBack.click();
    await expect(animalsPages.dashboard.heading).toBeVisible();
  });

  test('after a page opened by a Change link is refreshed, its Back still opens the review', async ({
    animalsSeededJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();
    const reference = await animalsSeededJourney.createDraftNotification();
    await animalsPages.notificationView.open(reference);
    await animalsPages.notificationView.changeLink('Change import details').click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();

    await pages.page.reload();
    await animalsPages.originOfImport.linkBack.click();

    await expect(animalsPages.notificationView.heading).toBeVisible();
  });
});

test.describe('Back through the journey pages', () => {
  test('a page opened from Overview goes Back to Overview, and the page Save and continue opened goes Back to it', async ({
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();
    await animalsJourney.toArrivalDetails();
    await animalsPages.arrivalDetails.linkBack.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsJourney.toArrivalDetails();
    await animalsPages.arrivalDetails.chooseMeansOfTransport(meansOfTransport.roadVehicle.display);
    await animalsPages.arrivalDetails.saveAndContinue.click();
    await expect(animalsPages.transitedCountries.heading).toBeVisible();

    await animalsPages.transitedCountries.linkBack.click();
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
  });
});

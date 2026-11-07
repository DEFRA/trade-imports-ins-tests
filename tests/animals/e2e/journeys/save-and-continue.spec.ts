import { MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { meansOfTransport } from '@domain/animals/constants/means-of-transport';

import { test, expect } from '@fixtures';

test.describe('Save and continue from Overview', () => {
  test('arrival details opened from Overview goes to the transit countries by road and to the transporter list by air', async ({
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();
    await animalsJourney.toArrivalDetails();

    await animalsPages.arrivalDetails.chooseMeansOfTransport(meansOfTransport.roadVehicle.display);
    await animalsPages.arrivalDetails.saveAndContinue.click();
    await expect(animalsPages.transitedCountries.heading).toBeVisible();

    await animalsJourney.toArrivalDetails();
    await animalsPages.arrivalDetails.chooseMeansOfTransport(meansOfTransport.airplane.display);
    await animalsPages.arrivalDetails.saveAndContinue.click();
    await expect(animalsPages.transporter.heading).toBeVisible();
  });

  test('a task opened from its Overview row opens its own page, and Save and continue goes to the next page in the journey order', async ({
    pages,
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();
    await animalsJourney.toImportReason();
    const reference = animalsPages.importReason.referenceNumberFromUrl();
    await expect(pages.page).toHaveURL(animalsPages.importReason.expectedUrl(reference));

    await animalsPages.importReason.reason(MANDATORY_ANSWERS.importReason.display).check();
    await animalsPages.importReason.purpose(MANDATORY_ANSWERS.internalMarketPurpose.display).check();
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await expect(pages.page).toHaveURL(animalsPages.consignmentDetails.expectedUrl(reference));
  });
});

test.describe('Save and continue to the next page', () => {
  test('transit countries saved with no country added goes to the transporter list', async ({ animalsJourney, animalsPages }) => {
    test.slow();
    await animalsJourney.toTransitedCountries();

    await animalsPages.transitedCountries.saveAndContinue.click();

    await expect(animalsPages.transporter.heading).toBeVisible();
  });

  test('contact address saved with no address chosen goes to check your answers', async ({ animalsJourney, animalsPages }) => {
    test.slow();
    await animalsJourney.toContactAddress();

    await animalsPages.contactAddress.saveAndContinue.click();

    await expect(animalsPages.notificationView.heading).toBeVisible();
  });

  test('a draft with nothing saved, resumed from the dashboard, opens at the first page', async ({ animalsJourney, animalsPages }) => {
    const referenceNumber = await animalsJourney.createNotificationAtOrigin();

    await animalsPages.dashboard.open();
    await animalsPages.dashboard.searchForReference(referenceNumber);
    await animalsPages.dashboard.resume(referenceNumber).click();

    await expect(animalsPages.originOfImport.heading).toBeVisible();
  });
});

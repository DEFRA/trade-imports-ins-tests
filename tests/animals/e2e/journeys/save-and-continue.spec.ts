import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { openReviewFromCompleteOverview } from '@page-objects/shared/journey-checks';
import { certificationPurposes } from '@domain/animals/constants/certification-purposes';
import { MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { meansOfTransport } from '@domain/animals/constants/means-of-transport';
import { AIR_OR_SEA_OVERVIEW_TASKS, certificateDocument } from '@flows/animals/journey';

import { test, expect } from '@fixtures';

test.describe('Save and continue through a new notification', () => {
  test(
    'walks a cattle-by-air notification through every task with Save and continue, from create to submitted',
    { tag: '@cross-browser' },
    async ({ animalsJourney, animalsPages, pages }) => {
      test.slow();

      const referenceNumber = await animalsJourney.walkCattleByAir(certificateDocument('AWBDOC'));
      await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(referenceNumber));

      await openReviewFromCompleteOverview(animalsPages.overview, animalsJourney, referenceNumber, AIR_OR_SEA_OVERVIEW_TASKS);

      const importDetails = animalsPages.notificationView.summaryCard('Import details');
      await expect(animalsPages.notificationView.regionOfOriginCode).toHaveText('FR-75');
      await expect(animalsPages.notificationView.summaryValue(importDetails, 'Internal reference number')).toHaveText('CATTLE-2026-01');

      const speciesCard = animalsPages.notificationView.speciesCard(commodityLines.cattle);
      await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Species')).toHaveText(commodityLines.cattle.latinName);
      await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Number of animals')).toHaveText('2');

      const reasonForImport = animalsPages.notificationView.summaryCard('Reason for import');
      await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Reason for import')).toHaveText('Internal market');
      await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Purpose in the market')).toHaveText('Breeding');

      const additionalAnimalDetails = animalsPages.notificationView.summaryCard('Additional animal details');
      await expect(animalsPages.notificationView.summaryValue(additionalAnimalDetails, 'Certified for')).toHaveText(
        certificationPurposes.furtherKeeping.display,
      );

      const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
      await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Name')).toContainText('García Livestock Transport SL');

      const rolesAndAddresses = animalsPages.notificationView.summaryCard('Roles and addresses');
      await expect(animalsPages.notificationView.summaryValue(rolesAndAddresses, 'County parish holding (CPH) number')).toHaveText(
        '123456789',
      );

      await animalsJourney.submitFromReview();
      await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
    },
  );

  test('following Back from the main import reason to What are you importing? and choosing Save and continue returns to the main import reason', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.walkToImportReason();
    await expect(animalsPages.importReason.heading).toBeVisible();

    await animalsPages.importReason.linkBack.click();
    await expect(animalsPages.commoditySelection.heading).toBeVisible();

    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(animalsPages.importReason.heading).toBeVisible();
  });

  test('ends on the review page after Save and continue, naming what is outstanding, when the notification is incomplete', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const referenceNumber = await animalsJourney.walkToRolesAndAddressesWithoutCph();

    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();
    await expect(pages.page).toHaveURL(animalsPages.contactAddress.expectedUrlPattern(referenceNumber));

    await animalsPages.contactAddress.address('Animal and Plant Health Agency').check();
    await animalsPages.contactAddress.saveAndContinue.click();

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(referenceNumber));
    await expect(animalsPages.notificationView.errorSummary).toContainText('Complete reason for import');
    await expect(animalsPages.notificationView.errorSummary).toContainText('Complete roles and addresses');

    await animalsPages.notificationView.continueButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.errorSummary).toBeFocused();
  });

  test('saving What are you importing? in a fresh browser session after saving the origin goes on to the main import reason', async ({
    saveAnimalsOriginThenOpenFreshSession,
  }) => {
    const { reference, freshPages } = await saveAnimalsOriginThenOpenFreshSession();

    await freshPages.commoditySelection.open(reference);
    await freshPages.commoditySelection.searchAndCheckSpecies([MANDATORY_ANSWERS.commodityLines[0].species]);
    await freshPages.commoditySelection.saveAndContinue.click();

    await expect(freshPages.importReason.heading).toBeVisible();
  });
});

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
    await expect(pages.page).toHaveURL(animalsPages.importReason.expectedUrlPattern(reference));

    await animalsPages.importReason.reason(MANDATORY_ANSWERS.importReason.display).check();
    await animalsPages.importReason.purpose(MANDATORY_ANSWERS.internalMarketPurpose.display).check();
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await expect(pages.page).toHaveURL(animalsPages.consignmentDetails.expectedUrlPattern(reference));
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

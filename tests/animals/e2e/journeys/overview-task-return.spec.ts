import { SET_BASES } from '@page-objects/shared/sets';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

import { test, expect } from '@fixtures';

test.describe('Overview task return', { tag: ['@integration'] }, () => {
  test('each task opened from the overview returns to the overview on Save and continue, at its opening-run address, and reads Complete', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const journeyId = await animalsJourney.startNotification();

    const expectOnOverview = async (): Promise<void> => {
      await expect(animalsPages.overview.heading).toBeVisible();
      await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyId}$`));
    };

    const openTask = async (name: string, slug: string): Promise<void> => {
      await expect(animalsPages.overview.task(name)).toHaveAttribute('href', new RegExp(`/notifications/${journeyId}/${slug}$`));
      await animalsPages.overview.task(name).click();
      await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyId}/${slug}$`));
    };

    const expectComplete = async (name: string): Promise<void> => {
      await expect(animalsPages.overview.taskStatus(name)).toHaveText('Complete');
    };

    await openTask('What are you importing?', 'commodities');
    await animalsPages.commoditySelection.selectSpecies(['Bos taurus']);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expectOnOverview();
    await expect(animalsPages.consignmentDetails.heading).toBeHidden();
    await expectComplete('What are you importing?');

    await openTask('Commodity details', 'consignment-details');
    await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
    await animalsPages.consignmentDetails.numberOfPackages.fill('5');
    await animalsPages.consignmentDetails.saveAndContinue.click();
    await expectOnOverview();
    await expectComplete('Commodity details');

    await openTask('Identification details', 'commodities/identification');
    await animalsPages.animalIdentification.earTag.fill('UK123456789012');
    await animalsPages.animalIdentification.saveAndContinue.click();
    await expectOnOverview();
    await expectComplete('Identification details');

    await openTask('Main reason for import', 'import-reason');
    await animalsPages.importReason.reason('Internal market').check();
    await animalsPages.importReason.purpose('Breeding').check();
    await animalsPages.importReason.saveAndContinue.click();
    await expectOnOverview();
    await expect(animalsPages.additionalDetails.heading).toBeHidden();
    await expectComplete('Main reason for import');

    await openTask('Additional details', 'additional-details');
    await animalsPages.additionalDetails.certifiedFor('Slaughter').check();
    await animalsPages.additionalDetails.containsUnweanedAnimals('No').check();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await expectOnOverview();
    await expectComplete('Additional details');

    await openTask('Arrival details', 'port-of-entry');
    await animalsJourney.fillArrivalDetails('Road');
    await animalsPages.arrivalDetails.saveAndContinue.click();
    await expectOnOverview();
    await expect(animalsPages.transitedCountries.heading).toBeHidden();
    await expect(animalsPages.transporter.heading).toBeHidden();
    await expectComplete('Arrival details');

    await openTask('Transit countries', 'transit-countries');
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expectOnOverview();
    await expect(animalsPages.transporter.heading).toBeHidden();
    await expectComplete('Transit countries');

    await openTask('Transport details', 'transporters');
    await animalsPages.transporter.transporter('García Livestock Transport SL').check();
    await animalsPages.transporter.saveAndContinue.click();
    await expectOnOverview();
    await expectComplete('Transport details');

    const document = {
      reference: `OVERVIEW${Date.now()}`,
      issueDate: '03/01/2026',
      type: 'VETERINARY_HEALTH_CERTIFICATE',
    };
    await openTask('Upload documents', 'accompanying-documents');
    await animalsPages.accompanyingDocuments.fillDocument(
      document.reference,
      document.issueDate,
      fileUploadPaths.safeFile1kbPdf,
      document.type,
    );
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
    await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
    await animalsPages.accompanyingDocuments
      .documentRow(document.reference)
      .filter({ hasText: 'Check completed' })
      .waitFor({ state: 'visible', timeout: fileUploadTimeouts.virusScanComplete });
    await animalsPages.accompanyingDocuments.continueButton.click();
    await expectOnOverview();
    await expectComplete('Upload documents');

    await openTask('Contact address for this consignment', 'consignment/contact/select');
    await animalsPages.contactAddress.address('Animal and Plant Health Agency').check();
    await animalsPages.contactAddress.saveAndContinue.click();
    await expectOnOverview();
    await expectComplete('Contact address for this consignment');
  });

  test('roles and addresses opened from the overview returns to the overview, not the CPH number page, for a consignment that needs one', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const journeyId = await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    await animalsPages.overview.task('Roles and addresses').click();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyId}/addresses$`));
    await animalsJourney.addFiveParties();
    await animalsPages.addresses.continueButton.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyId}$`));
    await expect(animalsPages.cphNumber.heading).toBeHidden();

    await animalsPages.overview.task('Roles and addresses').click();
    await animalsPages.addresses.addCph.click();
    await animalsPages.cphNumber.fillCphNumber();
    await animalsPages.cphNumber.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await animalsPages.addresses.continueButton.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus('Roles and addresses')).toHaveText('Complete');
  });
});

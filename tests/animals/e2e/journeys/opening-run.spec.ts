import { SET_BASES } from '@page-objects/shared/sets';
import { fileUploadPaths } from '@resources/file-upload/paths';

import { test, expect } from '@fixtures';

test.describe('Opening run', { tag: ['@integration'] }, () => {
  test('walks a cattle-by-air notification through the opening run in Design Release 2.1 order, from create to submitted', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const journeyId = await animalsJourney.walkOpeningRunCattleByAir({
      reference: `AWBDOC${Date.now()}`,
      issueDate: '03/01/2026',
      filePath: fileUploadPaths.safeFile1kbPdf,
      type: 'VETERINARY_HEALTH_CERTIFICATE',
    });
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyId}/notification-view$`));

    await animalsPages.overview.open(journeyId);
    for (const task of [
      'Where is this consignment coming from?',
      'What are you importing?',
      'Main reason for import',
      'Commodity details',
      'Identification details',
      'Additional details',
      'Arrival details',
      'Transport details',
      'Upload documents',
      'Roles and addresses',
      'Contact address for this consignment',
    ]) {
      await expect(animalsPages.overview.taskStatus(task)).toHaveText('Complete');
    }
    await animalsPages.overview.reviewAndSubmitButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    const importDetails = animalsPages.notificationView.summaryCard('Import details');
    await expect(animalsPages.notificationView.summaryValue(importDetails, 'Region of origin code')).toHaveText('FR-75');
    await expect(animalsPages.notificationView.summaryValue(importDetails, 'Internal reference number')).toHaveText('CATTLE-2026-01');

    const speciesCard = animalsPages.notificationView.summaryCard('Cow (0102) — Bos taurus');
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Species')).toHaveText('Bos taurus');
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Number of animals')).toHaveText('2');

    const reasonForImport = animalsPages.notificationView.summaryCard('Reason for import');
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Reason for import')).toHaveText('Internal market');
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Purpose in the market')).toHaveText('Breeding');

    const additionalAnimalDetails = animalsPages.notificationView.summaryCard('Additional animal details');
    await expect(animalsPages.notificationView.summaryValue(additionalAnimalDetails, 'Certified for')).toHaveText('Further keeping');

    const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Name')).toContainText('García Livestock Transport SL');

    const rolesAndAddresses = animalsPages.notificationView.summaryCard('Roles and addresses');
    await expect(animalsPages.notificationView.summaryValue(rolesAndAddresses, 'County parish holding (CPH) number')).toHaveText(
      '123456789',
    );

    await animalsJourney.submitFromReview();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
  });

  test('ends the opening run on the review page, naming what is outstanding, when the notification is incomplete', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const journeyId = await animalsJourney.walkOpeningRunToRolesAndAddressesWithoutCph();

    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyId}/consignment/contact/select`));

    await animalsPages.contactAddress.address('Animal and Plant Health Agency').check();
    await animalsPages.contactAddress.saveAndContinue.click();

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyId}/notification-view$`));
    await expect(animalsPages.notificationView.errorSummary).toContainText('Complete reason for import');
    await expect(animalsPages.notificationView.errorSummary).toContainText('Complete roles and addresses');

    await animalsPages.notificationView.continueButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.errorSummary).toBeFocused();
  });
});

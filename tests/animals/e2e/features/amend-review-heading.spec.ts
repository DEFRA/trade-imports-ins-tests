import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

const CHANGE_ORIGIN_OF_IMPORT = 'Change origin of import';

test.describe('Amendment review heading', { tag: ['@compose', '@integration'] }, () => {
  test("an amendment's review is headed Review your notification until an answer changes, then Review before re-submitting", async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.notificationView.open(reference);

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.resubmitHeading).toHaveCount(0);
    await expect(pages.page).toHaveTitle(/^Review your notification - /);

    await animalsPages.notificationView.changeLink(CHANGE_ORIGIN_OF_IMPORT).click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await animalsPages.originOfImport.internalReference.fill('RESUBMIT-REF');
    await animalsPages.originOfImport.saveAndReturn.click();

    await expect(animalsPages.notificationView.resubmitHeading).toBeVisible();
    await expect(pages.page).toHaveTitle(/^Review before re-submitting - /);
  });

  test('changing only the uploaded documents during an amendment keeps Review your notification', async ({
    animalsPages,
    animalsSeededJourney,
  }) => {
    test.slow();
    const reference = await animalsSeededJourney.createAmendNotification();
    const documentReference = `AMDOC${Date.now()}`;

    await animalsPages.accompanyingDocuments.open(reference);
    await animalsPages.accompanyingDocuments.fillDocument(documentReference, '03/01/2026', fileUploadPaths.safeFile1kbPdf);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
    await expect(animalsPages.accompanyingDocuments.documentRow(documentReference)).toContainText('Check completed', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });

    await animalsPages.notificationView.open(reference);

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.resubmitHeading).toHaveCount(0);
  });
});

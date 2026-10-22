import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { writePaddedPdf } from '@resources/file-upload/padded-pdf';
import { MAX_FILE_SIZE_BYTES, OVERSIZE_FILE_MESSAGE } from '@resources/file-upload/constants';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

const issueDate = '03/01/2026';
const maximumDocuments = 15;
const maximumDocumentsMessage = `You can upload a maximum of ${maximumDocuments} files`;

test.describe('Documents limits', { tag: '@duplicated-in-frontend' }, () => {
  test('accepts a fifteenth document and rejects a sixteenth with the maximum-documents error', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    test.setTimeout(120_000);
    await animalsJourney.toAccompanyingDocuments();

    for (let index = 1; index <= maximumDocuments; index += 1) {
      const reference = `PWCAP${Date.now()}${index}`;
      await animalsPages.accompanyingDocuments.fillDocument(reference, issueDate, fileUploadPaths.safeFile1kbPdf);
      await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
      await expect(animalsPages.accompanyingDocuments.documentRow(reference)).toContainText('Check completed', {
        timeout: fileUploadTimeouts.virusScanComplete,
      });
    }

    await expect(pages.page.locator('#documents-added tbody tr')).toHaveCount(maximumDocuments);
    await expect(animalsPages.accompanyingDocuments.saveAndAddAnother).toBeVisible();
    await expect(pages.page.locator('.govuk-error-summary')).toHaveCount(0);

    const sixteenthReference = `PWCAP${Date.now()}16`;
    await animalsPages.accompanyingDocuments.fillDocument(sixteenthReference, issueDate, fileUploadPaths.safeFile1kbPdf);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: maximumDocumentsMessage })).toBeVisible();
    await expect(pages.page.locator('.govuk-error-message')).toHaveCount(0);
    await expect(pages.page.locator('#documents-added tbody tr')).toHaveCount(maximumDocuments);
    await expect(animalsPages.accompanyingDocuments.documentRow(sixteenthReference)).toHaveCount(0);
  });

  test('accepts a PDF at the maximum file size and rejects one a byte over it', async ({
    animalsJourney,
    pages,
    animalsPages,
  }, testInfo) => {
    test.slow();
    const fileAtTheCap = await writePaddedPdf(testInfo.outputPath('boundary-exact.pdf'), MAX_FILE_SIZE_BYTES);
    const fileOneByteOver = await writePaddedPdf(testInfo.outputPath('boundary-over.pdf'), MAX_FILE_SIZE_BYTES + 1);
    await animalsJourney.toAccompanyingDocuments();

    const exactReference = `PWEXACT${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(exactReference, issueDate, fileAtTheCap);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(animalsPages.accompanyingDocuments.documentRow(exactReference)).toContainText('Check completed', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });
    await expect(pages.page.locator('.govuk-error-summary')).toHaveCount(0);

    const overReference = `PWOVER${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(overReference, issueDate, fileOneByteOver);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: OVERSIZE_FILE_MESSAGE })).toBeVisible();
    await expect(pages.page.locator('.govuk-error-message')).toHaveText(`Error: ${OVERSIZE_FILE_MESSAGE}`);
    await expect(pages.page.locator('#documents-added tbody tr')).toHaveCount(1);
    await expect(animalsPages.accompanyingDocuments.documentRow(overReference)).toHaveCount(0);
  });
});

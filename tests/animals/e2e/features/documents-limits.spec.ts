import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { writePaddedPdf } from '@resources/file-upload/padded-pdf';
import { DOCUMENT_ISSUE_DATE, MAX_FILE_SIZE_BYTES, OVERSIZE_FILE_MESSAGE } from '@resources/file-upload/constants';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

const maximumDocuments = 15;
const maximumDocumentsMessage = `You can upload a maximum of ${maximumDocuments} files`;

test.describe('Documents limits', { tag: '@duplicated-in-frontend' }, () => {
  test('accepts a fifteenth document and then shuts the add control, naming the cap', async ({ animalsPages, animalsJourney }) => {
    test.setTimeout(120_000);
    await animalsJourney.toAccompanyingDocuments();

    for (let index = 1; index <= maximumDocuments; index += 1) {
      const reference = `PWCAP${Date.now()}${index}`;
      await animalsPages.accompanyingDocuments.fillDocument(reference, DOCUMENT_ISSUE_DATE, fileUploadPaths.safeFile1kbPdf);
      await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
      await expect(animalsPages.accompanyingDocuments.documentRow(reference)).toContainText('Check completed', {
        timeout: fileUploadTimeouts.virusScanComplete,
      });
    }

    await expect(animalsPages.accompanyingDocuments.addedDocumentRows).toHaveCount(maximumDocuments);
    await expect(animalsPages.accompanyingDocuments.errorSummary).toHaveCount(0);

    // The control keeps its place in the tab order so the error summary can
    // reach it, so it is still on the page — but shut, and carrying no
    // formaction, so a sixteenth file is never sent to be scanned and stored
    // only to be turned away by the claim.
    const addControl = animalsPages.accompanyingDocuments.saveAndAddAnother;
    await expect(addControl).toBeVisible();
    await expect(addControl).toHaveAttribute('aria-disabled', 'true');
    await expect(addControl).toHaveAttribute('aria-describedby', 'add-document-error');
    await expect(addControl).not.toHaveAttribute('formaction', /./);
    await expect(animalsPages.accompanyingDocuments.addDocumentError).toHaveText(`Error: ${maximumDocumentsMessage}`);
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
    await animalsPages.accompanyingDocuments.fillDocument(exactReference, DOCUMENT_ISSUE_DATE, fileAtTheCap);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(animalsPages.accompanyingDocuments.documentRow(exactReference)).toContainText('Check completed', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });
    await expect(animalsPages.accompanyingDocuments.errorSummary).toHaveCount(0);

    const overReference = `PWOVER${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(overReference, DOCUMENT_ISSUE_DATE, fileOneByteOver);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: OVERSIZE_FILE_MESSAGE })).toBeVisible();
    await expect(animalsPages.accompanyingDocuments.fileFieldError).toHaveText(`Error: ${OVERSIZE_FILE_MESSAGE}`);
    await expect(animalsPages.accompanyingDocuments.addedDocumentRows).toHaveCount(1);
    await expect(animalsPages.accompanyingDocuments.documentRow(overReference)).toHaveCount(0);
  });
});

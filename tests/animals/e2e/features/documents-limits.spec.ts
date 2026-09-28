import { copyFile, mkdir, stat, truncate } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { MAX_FILE_SIZE_BYTES, OVERSIZE_FILE_MESSAGE } from '@resources/file-upload/constants';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

const issueDate = '03/01/2026';
const maximumDocuments = 15;
const maximumDocumentsMessage = `You can upload a maximum of ${maximumDocuments} files`;

const paddedPdf = async (destination: string, bytes: number): Promise<string> => {
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(fileUploadPaths.safeFile1kbPdf, destination);
  await truncate(destination, bytes);
  expect((await stat(destination)).size).toBe(bytes);
  return destination;
};

test.describe('Documents limits', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('accepts a fifteenth document and rejects a sixteenth with the maximum-documents error', async ({
    journey,
    pages,
    animalsPages,
  }) => {
    test.setTimeout(120_000);
    await journey.toAccompanyingDocuments();

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

  test('accepts a 10MB PDF and rejects the same real file at one byte over', async ({ journey, pages, animalsPages }, testInfo) => {
    test.slow();
    const exact = await paddedPdf(testInfo.outputPath('boundary-exact.pdf'), MAX_FILE_SIZE_BYTES);
    const over = await paddedPdf(testInfo.outputPath('boundary-over.pdf'), MAX_FILE_SIZE_BYTES + 1);
    await journey.toAccompanyingDocuments();

    const exactReference = `PWEXACT${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(exactReference, issueDate, exact);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(animalsPages.accompanyingDocuments.documentRow(exactReference)).toContainText('Check completed', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });
    await expect(pages.page.locator('.govuk-error-summary')).toHaveCount(0);

    const overReference = `PWOVER${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(overReference, issueDate, over);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: OVERSIZE_FILE_MESSAGE })).toBeVisible();
    await expect(pages.page.locator('.govuk-error-message')).toHaveText(`Error: ${OVERSIZE_FILE_MESSAGE}`);
    await expect(pages.page.locator('#documents-added tbody tr')).toHaveCount(1);
    await expect(animalsPages.accompanyingDocuments.documentRow(overReference)).toHaveCount(0);
  });
});

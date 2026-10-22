import { readFile } from 'node:fs/promises';
import { test, expect } from '@fixtures';
import { writePaddedPdf } from '@resources/file-upload/padded-pdf';
import { DOCUMENT_ISSUE_DATE, MAX_FILE_SIZE_BYTES } from '@resources/file-upload/constants';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

test.describe('Documents at the full file size', () => {
  test('uploads a file at the full limit, scans it, and serves the same bytes back', async ({
    animalsJourney,
    animalsPages,
    pages,
  }, testInfo) => {
    test.slow();
    await animalsJourney.toAccompanyingDocuments();

    const large = await writePaddedPdf(testInfo.outputPath('at-the-limit.pdf'), MAX_FILE_SIZE_BYTES);
    const reference = `PWBIG${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(reference, DOCUMENT_ISSUE_DATE, large);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    const row = animalsPages.accompanyingDocuments.documentRow(reference);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Check completed', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });

    const href = await animalsPages.accompanyingDocuments.viewFile(1).getAttribute('href');
    expect(href).toBeTruthy();
    const response = await pages.page.request.get(new URL(href, pages.page.url()).toString());
    expect(response.status()).toBe(200);
    expect((await response.body()).length).toBe(MAX_FILE_SIZE_BYTES);
    expect(await response.body()).toEqual(await readFile(large));
  });
});

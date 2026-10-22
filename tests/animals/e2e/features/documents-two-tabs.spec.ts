import { readFile } from 'node:fs/promises';
import { type Locator, type Page } from '@playwright/test';
import { test, expect } from '@fixtures';
import { createAnimalsPages } from '@page-objects';
import { writePaddedPdf } from '@resources/file-upload/padded-pdf';
import { DOCUMENT_ISSUE_DATE } from '@resources/file-upload/constants';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

// Distinct lengths are what this test needs, not large ones: a document serving
// back the other tab's bytes has to fail the comparison below.
const FIRST_TAB_FILE_BYTES = 2_000;
const SECOND_TAB_FILE_BYTES = 3_000;

const servedBytes = async (page: Page, row: Locator): Promise<Buffer> => {
  const href = await row.getByRole('link', { name: /View file/ }).getAttribute('href');
  expect(href).toBeTruthy();
  const response = await page.request.get(new URL(href, page.url()).toString());
  expect(response.status()).toBe(200);
  return response.body();
};

test.describe('Documents across two tabs', () => {
  test('keeps two tabs on one notification from taking each other’s upload', async ({ animalsJourney, animalsPages, pages }, testInfo) => {
    // Two real virus scans at roughly 30s each on CDP, so the tripled budget is
    // still needed even though the files are now small.
    test.slow();
    await animalsJourney.toAccompanyingDocuments();
    const documentsUrl = pages.page.url();

    const firstReference = `PWTABA${Date.now()}`;
    const secondReference = `PWTABB${Date.now()}`;
    const firstFile = await writePaddedPdf(testInfo.outputPath('tab-a.pdf'), FIRST_TAB_FILE_BYTES);
    const secondFile = await writePaddedPdf(testInfo.outputPath('tab-b.pdf'), SECOND_TAB_FILE_BYTES);

    const secondTab = await pages.page.context().newPage();
    await secondTab.goto(documentsUrl);
    const secondTabPages = createAnimalsPages(secondTab).accompanyingDocuments;
    await expect(secondTabPages.heading).toBeVisible();

    await animalsPages.accompanyingDocuments.fillDocument(firstReference, DOCUMENT_ISSUE_DATE, firstFile);
    await secondTabPages.fillDocument(secondReference, DOCUMENT_ISSUE_DATE, secondFile);

    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
    await secondTabPages.saveAndAddAnother.click();

    await expect(animalsPages.accompanyingDocuments.documentRow(firstReference)).toContainText('Check completed', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });
    await expect(secondTabPages.documentRow(secondReference)).toContainText('Check completed', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });

    await pages.page.reload();
    await expect(animalsPages.accompanyingDocuments.documentRow(firstReference)).toBeVisible();
    await expect(animalsPages.accompanyingDocuments.documentRow(secondReference)).toBeVisible();
    await expect(animalsPages.accompanyingDocuments.addedDocumentRows).toHaveCount(2);

    expect(await servedBytes(pages.page, animalsPages.accompanyingDocuments.documentRow(firstReference))).toEqual(
      await readFile(firstFile),
    );
    expect(await servedBytes(pages.page, animalsPages.accompanyingDocuments.documentRow(secondReference))).toEqual(
      await readFile(secondFile),
    );

    await secondTab.close();
  });
});

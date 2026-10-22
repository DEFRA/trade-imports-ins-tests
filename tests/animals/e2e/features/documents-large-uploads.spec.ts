import { readFile } from 'node:fs/promises';
import { type Locator, type Page } from '@playwright/test';
import { test, expect } from '@fixtures';
import { createAnimalsPages } from '@page-objects';
import { writePaddedPdf } from '@resources/file-upload/padded-pdf';
import { DOCUMENT_ISSUE_DATE, MAX_FILE_SIZE_BYTES } from '@resources/file-upload/constants';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

const servedBytes = async (page: Page, row: Locator): Promise<Buffer> => {
  const href = await row.getByRole('link', { name: /View file/ }).getAttribute('href');
  expect(href).toBeTruthy();
  const response = await page.request.get(new URL(href, page.url()).toString());
  expect(response.status()).toBe(200);
  return response.body();
};

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

  test('keeps two tabs on one notification from taking each other’s upload', async ({ animalsJourney, animalsPages, pages }, testInfo) => {
    test.slow();
    await animalsJourney.toAccompanyingDocuments();
    const documentsUrl = pages.page.url();

    const firstReference = `PWTABA${Date.now()}`;
    const secondReference = `PWTABB${Date.now()}`;
    // Different lengths, so a document serving back the other tab's bytes
    // fails the comparison below instead of passing on identical padding.
    const firstFile = await writePaddedPdf(testInfo.outputPath('tab-a.pdf'), MAX_FILE_SIZE_BYTES);
    const secondFile = await writePaddedPdf(testInfo.outputPath('tab-b.pdf'), MAX_FILE_SIZE_BYTES - 1_000);

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

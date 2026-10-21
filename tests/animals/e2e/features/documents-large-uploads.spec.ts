import { readFile } from 'node:fs/promises';
import { test, expect } from '@fixtures';
import { createAnimalsPages } from '@page-objects';
import { paddedPdf } from '@resources/file-upload/padded-pdf';
import { MAX_FILE_SIZE_BYTES } from '@resources/file-upload/constants';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

const issueDate = '03/01/2026';

/**
 * The browser posts its file to the platform's upload bypass rather than through the frontend, so
 * a document is no longer bounded by the request-body limit in front of the service. These are the
 * two things that could not happen before: a file far larger than that limit, and two tabs each
 * carrying their own.
 */
test.describe('Documents at the full file size', { tag: '@compose' }, () => {
  test('uploads a file at the full limit, scans it, and serves the same bytes back', async ({
    animalsJourney,
    animalsPages,
    pages,
  }, testInfo) => {
    test.slow();
    await animalsJourney.toAccompanyingDocuments();

    const large = await paddedPdf(testInfo.outputPath('at-the-limit.pdf'), MAX_FILE_SIZE_BYTES);
    const reference = `PWBIG${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(reference, issueDate, large);
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
    const firstFile = await paddedPdf(testInfo.outputPath('tab-a.pdf'), MAX_FILE_SIZE_BYTES);
    const secondFile = await paddedPdf(testInfo.outputPath('tab-b.pdf'), MAX_FILE_SIZE_BYTES);

    // A second tab on the same notification, each holding its own upload session.
    const secondTab = await pages.page.context().newPage();
    await secondTab.goto(documentsUrl);
    const secondTabPages = createAnimalsPages(secondTab).accompanyingDocuments;
    await expect(secondTabPages.heading).toBeVisible();

    await animalsPages.accompanyingDocuments.fillDocument(firstReference, issueDate, firstFile);
    await secondTabPages.fillDocument(secondReference, issueDate, secondFile);

    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
    await secondTabPages.saveAndAddAnother.click();

    await expect(animalsPages.accompanyingDocuments.documentRow(firstReference)).toContainText('Check completed', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });
    await expect(secondTabPages.documentRow(secondReference)).toContainText('Check completed', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });

    // Both documents belong to the notification, each with its own file, and neither tab's
    // upload replaced the other's.
    await pages.page.reload();
    await expect(animalsPages.accompanyingDocuments.documentRow(firstReference)).toBeVisible();
    await expect(animalsPages.accompanyingDocuments.documentRow(secondReference)).toBeVisible();
    await expect(pages.page.locator('#documents-added tbody tr')).toHaveCount(2);

    await secondTab.close();
  });
});

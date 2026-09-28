import { readFile } from 'node:fs/promises';
import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

test.describe('Promoted accompanying documents integration', { tag: ['@compose', '@integration'] }, () => {
  test('uploads, scans, downloads and removes a document through the real uploader', async ({ journey, pages }) => {
    test.slow();
    await journey.toAccompanyingDocuments();
    const reference = `PW${Date.now()}`;

    await pages.accompanyingDocuments.fillDocument(reference, '03/01/2026', fileUploadPaths.safeFile1kbPdf);
    await pages.accompanyingDocuments.saveAndAddAnother.click();

    const row = pages.accompanyingDocuments.documentRow(reference);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Check completed', { timeout: fileUploadTimeouts.virusScanComplete });

    const viewLink = pages.accompanyingDocuments.viewFile(1);
    const href = await viewLink.getAttribute('href');
    expect(href).toBeTruthy();
    if (!href) {
      throw new Error('The uploaded document did not have a view URL');
    }
    const response = await pages.page.request.get(new URL(href, pages.page.url()).toString());
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    const downloaded = await response.body();
    const uploaded = await readFile(fileUploadPaths.safeFile1kbPdf);

    await pages.accompanyingDocuments.removeDocument(1).click();
    await expect(row).toHaveCount(0);
    await expect(pages.page.getByText('You have not added any documents yet.')).toBeVisible();

    expect(downloaded).toEqual(uploaded);
  });

  test('rejects an unsupported file type without adding a document', async ({ journey, pages }) => {
    await journey.toAccompanyingDocuments();
    await pages.accompanyingDocuments.fillDocument(`PW-TXT-${Date.now()}`, '03/01/2026', fileUploadPaths.restrictedFile10bTxt);
    await pages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByText('You have not added any documents yet.')).toBeVisible();
  });
});

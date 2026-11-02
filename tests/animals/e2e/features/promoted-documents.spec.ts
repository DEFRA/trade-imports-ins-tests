import { readFile } from 'node:fs/promises';
import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { EMPTY_DOCUMENT_LIST_CARD_TEXT } from '@page-objects/animals/accompanying-documents-page';

test.describe('Promoted accompanying documents integration', { tag: '@compose' }, () => {
  test('uploads, scans, downloads and removes a document', async ({ animalsJourney, pages, animalsPages }) => {
    test.slow();
    await animalsJourney.toAccompanyingDocuments();
    const row = await animalsJourney.uploadScannedDocument();

    const viewLink = animalsPages.accompanyingDocuments.viewFile(1);
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

    await animalsPages.accompanyingDocuments.removeDocument(1).click();
    await expect(row).toHaveCount(0);
    await expect(animalsPages.accompanyingDocuments.addedDocumentsTable).toHaveCount(0);
    await expect(animalsPages.accompanyingDocuments.fileUploadCard).toHaveText(EMPTY_DOCUMENT_LIST_CARD_TEXT);

    expect(downloaded).toEqual(uploaded);
  });

  test('lists an added document under five headings with View file and Remove at the end of the row', async ({
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();
    await animalsJourney.toAccompanyingDocuments();
    const row = await animalsJourney.uploadScannedDocument();

    await expect(animalsPages.accompanyingDocuments.addedDocumentsTable.getByRole('columnheader')).toHaveText([
      'Document reference',
      'Document type',
      'Date of issue',
      'Status',
      'Action',
    ]);
    const actionsCell = row.getByRole('cell').last();
    await expect(actionsCell.locator(animalsPages.accompanyingDocuments.viewFile(1))).toBeVisible();
    await expect(actionsCell.locator(animalsPages.accompanyingDocuments.removeDocument(1))).toBeVisible();
  });

  test('rejects an unsupported file type without adding a document', async ({ animalsJourney, pages, animalsPages }) => {
    await animalsJourney.toAccompanyingDocuments();
    await animalsPages.accompanyingDocuments.fillDocument(`PW-TXT-${Date.now()}`, '03/01/2026', fileUploadPaths.restrictedFile10bTxt);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(animalsPages.accompanyingDocuments.addedDocumentsTable).toHaveCount(0);
    await expect(animalsPages.accompanyingDocuments.fileUploadCard).toHaveText(EMPTY_DOCUMENT_LIST_CARD_TEXT);
  });
});

import { readFile } from 'node:fs/promises';
import { test, expect } from '@fixtures';
import { fileUploadNames, fileUploadPaths } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

test.describe('Promoted accompanying documents integration', { tag: '@compose' }, () => {
  test('uploads, scans, downloads and removes a document through the real uploader', async ({ animalsJourney, pages, animalsPages }) => {
    test.slow();
    await animalsJourney.toAccompanyingDocuments();
    const reference = `PW${Date.now()}`;

    await animalsPages.accompanyingDocuments.fillDocument(reference, '03/01/2026', fileUploadPaths.safeFile1kbPdf);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    const row = animalsPages.accompanyingDocuments.documentRow(reference);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Check completed', { timeout: fileUploadTimeouts.virusScanComplete });

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
    await expect(pages.page.getByText('You have not added any documents yet.')).toBeVisible();

    expect(downloaded).toEqual(uploaded);
  });

  test("reads each saved document back on the review in its own Document card naming its file, and a card's Change link returns to the review", async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();
    await animalsJourney.toAccompanyingDocuments();
    const journeyId = animalsPages.accompanyingDocuments.journeyIdFromUrl();
    const firstReference = `PWDOCA${Date.now()}`;
    const secondReference = `PWDOCB${Date.now()}`;

    await animalsPages.accompanyingDocuments.fillDocument(firstReference, '03/01/2026', fileUploadPaths.safeFile1kbPdf);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
    await expect(animalsPages.accompanyingDocuments.documentRow(firstReference)).toContainText('Check completed', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });
    await animalsPages.accompanyingDocuments.fillDocument(secondReference, '03/01/2026', fileUploadPaths.safeFile100kbJpg);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
    await expect(animalsPages.accompanyingDocuments.documentRow(secondReference)).toContainText('Check completed', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });

    await animalsPages.notificationView.open(journeyId);

    const firstCard = animalsPages.notificationView.summaryCard('Document 1');
    await expect(firstCard.getByRole('term')).toHaveText(['Document reference', 'Document type', 'Date of issue', 'Attachment']);
    await expect(animalsPages.notificationView.summaryValue(firstCard, 'Document reference')).toHaveText(firstReference);
    await expect(animalsPages.notificationView.summaryValue(firstCard, 'Document type')).toHaveText(
      'Intra Trade Animal Health Certificate (ITAHC)',
    );
    await expect(animalsPages.notificationView.summaryValue(firstCard, 'Date of issue')).toHaveText('03/01/2026');
    await expect(animalsPages.notificationView.summaryValue(firstCard, 'Attachment')).toHaveText(fileUploadNames.safeFile1kbPdf);

    const secondCard = animalsPages.notificationView.summaryCard('Document 2');
    await expect(animalsPages.notificationView.summaryValue(secondCard, 'Document reference')).toHaveText(secondReference);
    await expect(animalsPages.notificationView.summaryValue(secondCard, 'Attachment')).toHaveText(fileUploadNames.safeFile100kbJpg);

    await expect(animalsPages.notificationView.summaryCard('Uploaded documents')).toHaveCount(0);
    await expect(pages.page.getByText('You have not added any documents yet.')).toHaveCount(0);

    await secondCard.getByRole('link', { name: 'Change document 2' }).click();
    await expect(pages.page).toHaveURL(/\/accompanying-documents\?change=1$/);
    await animalsPages.accompanyingDocuments.continueButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/notification-view$/);
  });

  test('rejects an unsupported file type without adding a document', async ({ animalsJourney, pages, animalsPages }) => {
    await animalsJourney.toAccompanyingDocuments();
    await animalsPages.accompanyingDocuments.fillDocument(`PW-TXT-${Date.now()}`, '03/01/2026', fileUploadPaths.restrictedFile10bTxt);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByText('You have not added any documents yet.')).toBeVisible();
  });
});

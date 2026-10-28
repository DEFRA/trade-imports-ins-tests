import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { DOCUMENT_ISSUE_DATE } from '@resources/file-upload/constants';

for (const [mode, javaScriptEnabled] of [
  ['with JavaScript', true],
  ['without JavaScript', false],
] as const) {
  test.describe(`Upload documents reached again through the browser history ${mode}`, () => {
    test.use({ javaScriptEnabled });

    test('adds a second document after the browser back button returns to the page', async ({ animalsJourney, animalsPages, pages }) => {
      test.slow();
      await animalsJourney.toAccompanyingDocuments();
      const first = `PWBACKA${Date.now()}`;
      const second = `PWBACKB${Date.now()}`;

      await animalsPages.accompanyingDocuments.fillDocument(first, DOCUMENT_ISSUE_DATE, fileUploadPaths.safeFile1kbPdf);
      await animalsPages.accompanyingDocuments.saveAndReturnToOverview.click();
      await expect(animalsPages.overview.heading).toBeVisible();

      await pages.page.goBack();
      await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
      await animalsPages.accompanyingDocuments.fillDocument(second, DOCUMENT_ISSUE_DATE, fileUploadPaths.safeFile1kbPdf);
      await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

      await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
      await expect(animalsPages.accompanyingDocuments.documentRow(first)).toBeVisible();
      await expect(animalsPages.accompanyingDocuments.documentRow(second)).toBeVisible();
      await expect(animalsPages.accompanyingDocuments.addedDocumentRows).toHaveCount(2);
    });
  });
}

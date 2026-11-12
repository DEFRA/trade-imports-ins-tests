import { test, expect } from '@fixtures/visual';
import { ALL_ANSWERS, LONG_DOCUMENT_REFERENCE } from '@domain/animals/constants/journey-options';

test.use({ headless: true });

test.describe('Upload documents (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toAccompanyingDocuments();
  });

  test('shows expected page appearance with one scanned document listed', async ({ page, animalsPages, animalsJourney }) => {
    test.slow();
    await animalsJourney.uploadDocumentAndWaitForScan({ ...ALL_ANSWERS.accompanyingDocument, reference: LONG_DOCUMENT_REFERENCE });

    await expect(page).toHaveScreenshot('upload-documents-one-document.png', {
      fullPage: true,
      mask: [animalsPages.accompanyingDocuments.journeyStrip],
    });
  });
});

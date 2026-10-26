import { test, expect } from '@fixtures';
import { EMPTY_DOCUMENT_LIST_CARD_TEXT } from '@page-objects/animals/accompanying-documents-page';
import { writeSyntheticFile } from '@utils/synthetic-file-writer';
import { ABOVE_PAYLOAD_CAP_BYTES, OVERSIZE_FILE_MESSAGE } from '@resources/file-upload/constants';

const issueDate = '03/01/2026';

test.describe('Documents reject flows', { tag: '@duplicated-in-frontend' }, () => {
  test('refuses an oversize file pick without adding a document', async ({ animalsJourney, pages, animalsPages }, testInfo) => {
    test.slow();
    await animalsJourney.toAccompanyingDocuments();

    const oversize = await writeSyntheticFile(testInfo.outputPath('oversize'), 'oversize.pdf', {
      bytes: ABOVE_PAYLOAD_CAP_BYTES,
    });
    await animalsPages.accompanyingDocuments.fillDocument(`PW-BIG-${Date.now()}`, issueDate, oversize.filePath);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByText(OVERSIZE_FILE_MESSAGE).first()).toBeVisible();
    await expect(animalsPages.accompanyingDocuments.addedDocumentsTable).toHaveCount(0);
    await expect(animalsPages.accompanyingDocuments.fileUploadCard).toHaveText(EMPTY_DOCUMENT_LIST_CARD_TEXT);
  });
});

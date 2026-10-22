import { test, expect } from '@fixtures';
import { writeSyntheticFile } from '@utils/synthetic-file-writer';
import { ABOVE_MAX_FILE_SIZE_BYTES, DOCUMENT_ISSUE_DATE, OVERSIZE_FILE_MESSAGE } from '@resources/file-upload/constants';

test.describe('Documents reject flows', { tag: '@duplicated-in-frontend' }, () => {
  test('refuses an oversize file pick without adding a document', async ({ animalsJourney, pages, animalsPages }, testInfo) => {
    test.slow();
    await animalsJourney.toAccompanyingDocuments();

    const oversize = await writeSyntheticFile(testInfo.outputPath('oversize'), 'oversize.pdf', {
      bytes: ABOVE_MAX_FILE_SIZE_BYTES,
    });
    await animalsPages.accompanyingDocuments.fillDocument(`PW-BIG-${Date.now()}`, DOCUMENT_ISSUE_DATE, oversize.filePath);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    // The browser refuses the pick; the upload service refuses it on receipt if that check did
    // not run. Either path shows the same message.
    await expect(pages.page.getByText(OVERSIZE_FILE_MESSAGE).first()).toBeVisible();
    await expect(pages.page.getByText('You have not added any documents yet.')).toBeVisible();
  });
});

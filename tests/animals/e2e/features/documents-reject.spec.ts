import { test, expect } from '@fixtures';
import { writeSyntheticFile } from '@utils/synthetic-file-writer';
import { ABOVE_PAYLOAD_CAP_BYTES, OVERSIZE_FILE_MESSAGE } from '@resources/file-upload/constants';

const issueDate = '03/01/2026';

test.describe('Documents reject flows', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('refuses an oversize file pick without adding a document', async ({ journey, pages }, testInfo) => {
    test.slow();
    await journey.toAccompanyingDocuments();

    const oversize = await writeSyntheticFile(testInfo.outputPath('oversize'), 'oversize.pdf', {
      bytes: ABOVE_PAYLOAD_CAP_BYTES,
    });
    await pages.accompanyingDocuments.fillDocument(`PW-BIG-${Date.now()}`, issueDate, oversize.filePath);
    await pages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    // The oversize message renders both client-side and server-side; either satisfies the reject.
    await expect(pages.page.getByText(OVERSIZE_FILE_MESSAGE).first()).toBeVisible();
    await expect(pages.page.getByText('You have not added any documents yet.')).toBeVisible();
  });
});

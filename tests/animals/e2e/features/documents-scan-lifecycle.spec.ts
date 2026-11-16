import { test, expect } from '@fixtures';
import { DOCUMENT_ISSUE_DATE } from '@resources/file-upload/constants';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import { eicarPdfUpload } from '@utils/eicar-upload';
import { firstScanStatus } from '@utils/scan-status';

test.describe('Documents scan lifecycle', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toAccompanyingDocuments();
  });

  test('infected upload: Virus found with an error summary that blocks Save and continue until the file is removed', async ({
    pages,
    animalsPages,
  }) => {
    test.slow();
    const eicar = eicarPdfUpload();
    const infectedFileError = pages.page.getByText(`${eicar.name} cannot be used. Remove it and try again with a different file.`).first();

    const reference = `PWVIRUS${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(reference, DOCUMENT_ISSUE_DATE, eicar);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    const row = animalsPages.accompanyingDocuments.documentRow(reference);
    await expect(row).toContainText('Virus found', { timeout: fileUploadTimeouts.virusScanComplete });

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(infectedFileError).toBeVisible();
    await expect(animalsPages.accompanyingDocuments.viewFile(1)).toHaveCount(0);

    await animalsPages.accompanyingDocuments.saveAndContinue.click();
    await expect(infectedFileError).toBeVisible();

    await animalsPages.accompanyingDocuments.removeDocument(1).click();
    await animalsPages.accompanyingDocuments.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
  });

  test('infected upload: the review marks the Document 1 card as rejected and links the error summary to it', async ({
    animalsPages,
    animalsNotificationActions,
    journeyContext,
  }) => {
    test.slow();
    const reference = `PWVIRUS${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(reference, DOCUMENT_ISSUE_DATE, eicarPdfUpload());
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    const row = animalsPages.accompanyingDocuments.documentRow(reference);
    await expect(row).toContainText('Virus found', { timeout: fileUploadTimeouts.virusScanComplete });

    await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);

    const rejectedMessage = 'One or more of your documents were rejected. Return to Documents to remove and re-upload.';
    const documentCard = animalsPages.notificationView.documentCard(1);
    await expect(documentCard).toContainText(rejectedMessage);
    await expect(animalsPages.notificationView.errorSummaryLink(rejectedMessage)).toHaveAttribute(
      'href',
      `#${await documentCard.getAttribute('id')}`,
    );
  });

  test('clean upload: Save and return to overview reaches the overview, and the row settles to Check completed with a view link on reopening', async ({
    animalsPages,
  }) => {
    test.slow();
    const reference = `PWSCAN${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(reference, DOCUMENT_ISSUE_DATE, fileUploadPaths.safeFile1kbPdf);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    const row = animalsPages.accompanyingDocuments.documentRow(reference);
    const { pending, text } = await firstScanStatus(row, 'Check completed');
    if (pending) {
      expect(text).not.toContain('View file');
    }
    await expect(animalsPages.accompanyingDocuments.removeDocument(1)).toBeVisible();

    await animalsPages.accompanyingDocuments.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Upload documents').click();
    const reopenedRow = animalsPages.accompanyingDocuments.documentRow(reference);
    await expect(reopenedRow).toContainText('Check completed', { timeout: fileUploadTimeouts.virusScanComplete });
    await expect(animalsPages.accompanyingDocuments.viewFile(1)).toBeVisible();
  });
});

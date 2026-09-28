import { test, expect } from '@fixtures';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { firstScanStatus } from '@utils/scan-status';

const issueDate = '03/01/2026';

test.describe('Documents scan refresh without JavaScript', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.use({ javaScriptEnabled: false });

  test('the refresh fallback reflects scan progress without client JavaScript', async ({ animalsJourney, pages, animalsPages }) => {
    test.slow();
    await animalsJourney.startNotification();

    await animalsPages.overview.task('Where is this consignment coming from?').click();
    await pages.page.getByLabel('Country of origin').selectOption('FR');
    await pages.page.getByRole('radio', { name: 'No' }).check();
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsJourney.answerCommodity();
    await animalsPages.overview.task('Upload documents').click();
    await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();

    const reference = `PWNOJS${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(reference, issueDate, fileUploadPaths.safeFile1kbPdf);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    const row = animalsPages.accompanyingDocuments.documentRow(reference);
    const { pending } = await firstScanStatus(row, 'Check completed');
    if (pending) {
      await expect(animalsPages.accompanyingDocuments.refreshStatus).toBeVisible();
      await expect(animalsPages.accompanyingDocuments.refreshStatus).toHaveAttribute('href', /attempt=1/);

      await expect
        .poll(
          async () => {
            await animalsPages.accompanyingDocuments.refreshStatus.click();
            return row.textContent();
          },
          { timeout: fileUploadTimeouts.virusScanComplete },
        )
        .toContain('Check completed');
    }

    await expect(row).toContainText('Check completed');
    await expect(animalsPages.accompanyingDocuments.refreshStatus).toHaveCount(0);
    await expect(animalsPages.accompanyingDocuments.viewFile(1)).toBeVisible();
  });
});

import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

test.describe('Security scan (frontend, documents)', { tag: '@active' }, () => {
  test('routes a document upload through the ZAP proxy', async ({ journey, pages }) => {
    test.slow();
    await journey.toAccompanyingDocuments();

    // File upload is the richest input surface the wizard has, and the only
    // page whose routes carry a second, nested id — the uploadId dataDrivenNode
    // in the ZAP plans has nothing to fold until a spec drives these.
    const reference = `PWSEC${Date.now()}`;
    await pages.accompanyingDocuments.fillDocument(reference, '03/01/2026', fileUploadPaths.safeFile1kbPdf);
    await pages.accompanyingDocuments.saveAndAddAnother.click();

    const row = pages.accompanyingDocuments.documentRow(reference);
    await expect(row).toBeVisible();

    // Waiting for the scan to clear is what puts the polled status route and
    // the file-download route in the site tree; a bare upload leaves both out.
    await expect(row).toContainText('Check completed', { timeout: fileUploadTimeouts.virusScanComplete });
    await pages.accompanyingDocuments.viewFile(1).click();
  });
});

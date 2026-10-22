import { expect, type Locator } from '@playwright/test';
import type { AnimalsAccompanyingDocumentsPage } from '@page-objects/animals/accompanying-documents-page';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

export const expectNoDocumentsAdded = async (documentsPage: AnimalsAccompanyingDocumentsPage): Promise<void> => {
  await expect(documentsPage.addedDocumentsTable).toHaveCount(0);
  await expect(documentsPage.fileUploadCard).toHaveText(/Save and add another\s*$/);
};

export const addScannedDocument = async (documentsPage: AnimalsAccompanyingDocumentsPage): Promise<Locator> => {
  const reference = `PW${Date.now()}`;
  await documentsPage.fillDocument(reference, '03/01/2026', fileUploadPaths.safeFile1kbPdf);
  await documentsPage.saveAndAddAnother.click();

  const row = documentsPage.documentRow(reference);
  await expect(row).toBeVisible();
  await expect(row).toContainText('Check completed', { timeout: fileUploadTimeouts.virusScanComplete });
  return row;
};

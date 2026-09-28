import { readFile } from 'node:fs/promises';
import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type AccompanyingDocumentModel } from '@domain/models/db/accompanying-document';
import { fileUploadPaths, fileUploadNames } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import { timeouts } from '@config/timeouts';
import { toUtcDate } from '@utils/date-utils';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

/**
 * Integration seam: real uploader -> backend/Mongo persistence -> reload.
 *
 * The trader picks the document type from the select on the upload page, so the seam
 * uploads a real file through cdp-uploader, waits for the virus scan, and asserts the persisted
 * accompanying_documents projection + that the uploaded row survives a fresh page load.
 */
test.describe('Accompanying document persistence round-trip', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('uploads a document that persists to Mongo and reloads', async ({ journey, journeyContext, pages }) => {
    test.slow();
    await journey.toAccompanyingDocuments();
    const referenceNumber = journeyContext.journeyId;
    const documentReference = `PW${Date.now()}`;
    const issueDate = '03/01/2026';
    const persistedIssueDate = { day: '3', month: '1', year: '2026' };

    await pages.accompanyingDocuments.fillDocument(documentReference, issueDate, fileUploadPaths.safeFile1kbPdf);
    await pages.accompanyingDocuments.saveAndAddAnother.click();

    const row = pages.accompanyingDocuments.documentRow(documentReference);
    await expect(row).toBeVisible({ timeout: fileUploadTimeouts.documentsListVisible });
    await expect(row).toContainText('Check completed', { timeout: fileUploadTimeouts.virusScanComplete });

    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<AccompanyingDocumentModel>('trade-imports-animals-backend', 'accompanying_documents');
      await expect
        .poll(() => collection.countDocuments({ notificationReferenceNumber: referenceNumber }), {
          timeout: timeouts.short,
        })
        .toBe(1);

      const [doc] = await collection.find({ notificationReferenceNumber: referenceNumber }).toArray();
      const [file] = doc.files;
      const uploaded = await readFile(fileUploadPaths.safeFile1kbPdf);

      expect(doc.notificationReferenceNumber).toBe(referenceNumber);
      expect(doc.documentReference).toBe(documentReference);
      expect(doc.uploadId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(doc.dateOfIssue.getTime()).toBe(toUtcDate(persistedIssueDate).getTime());
      await expect.poll(() => collection.findOne({ uploadId: doc.uploadId }).then((d) => d?.scanStatus)).toBe('COMPLETE');
      expect(doc.documentType).toBe('ITAHC');

      expect(file.filename).toBe(fileUploadNames.safeFile1kbPdf);
      expect(file.contentType).toBe('application/pdf');
      expect(file.contentLength).toBe(uploaded.length);
      expect(file.s3Key).toMatch(new RegExp(`^${referenceNumber}/${doc.uploadId}/`));
      expect(file.detectedContentType).toBe('application/pdf');
      expect(file.checksumSha256).toBeDefined();
    } finally {
      await client.close();
    }

    await pages.accompanyingDocuments.open(referenceNumber);
    await expect(pages.accompanyingDocuments.documentRow(documentReference)).toBeVisible();
  });
});

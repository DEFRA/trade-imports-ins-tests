import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_DELETED = 'uk.gov.defra.imports.notification.NotificationDeleted';
const NOTIFICATION_SUBMISSION_DELETED = 'uk.gov.defra.imports.notification.NotificationSubmissionDeleted';
const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

test.describe('Notification deleted outbox events', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('writes a NotificationDeleted event when a draft is soft-deleted', async ({ seededJourney }) => {
    test.slow();
    const referenceNumber = await seededJourney.createEmptyNotification();
    await seededJourney.softDelete(referenceNumber);

    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');

      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_DELETED }), {
          timeout: timeouts.long,
        })
        .toBe(1);

      const [doc] = await collection.find({ aggregateId, eventType: NOTIFICATION_DELETED }).toArray();

      expect(doc.eventType).toBe(NOTIFICATION_DELETED);
      expect(doc.aggregateType).toBe('Notification');
      expect(doc.subType).toBe('GBN-AG');
      expect(doc.timestamp).toBeInstanceOf(Date);
      expect(doc.metadata.correlationId).toBeDefined();
      expect(doc.data.exchangedDocument.identifier).toBe(referenceNumber);
      expect(doc.data.exchangedDocument.notificationStatusCode).toBe('DELETED');
      expect(doc.data.exchangedDocument.versionId).toBeUndefined();
    } finally {
      await client.close();
    }
  });

  test('writes a NotificationSubmissionDeleted event when a submitted notification is soft-deleted', async ({ seededJourney }) => {
    test.slow();
    const referenceNumber = await seededJourney.createSubmittedNotification();
    // Not notificationApi.softDeleteNotification: it sends no actor, and a submitted notification's address-book parties need an organisation id.
    await seededJourney.softDelete(referenceNumber);

    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');

      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_SUBMISSION_DELETED }), {
          timeout: timeouts.long,
        })
        .toBe(1);

      const [doc] = await collection.find({ aggregateId, eventType: NOTIFICATION_SUBMISSION_DELETED }).toArray();

      expect(doc.eventType).toBe(NOTIFICATION_SUBMISSION_DELETED);
      expect(doc.aggregateType).toBe('Notification');
      expect(doc.subType).toBe('GBN-AG');
      expect(doc.timestamp).toBeInstanceOf(Date);
      expect(doc.metadata.correlationId).toBeDefined();
      expect(doc.data.exchangedDocument.identifier).toBe(referenceNumber);
      expect(doc.data.exchangedDocument.notificationStatusCode).toBe('DELETED');
      expect(doc.data.exchangedDocument.versionId).toBe(1);
      expect(doc.statusChanges?.map(({ status }) => status)).toEqual(['DRAFT', 'SUBMITTED', 'DELETED']);
    } finally {
      await client.close();
    }
  });
});

import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_AMENDMENT_CANCELLED = 'uk.gov.defra.imports.notification.NotificationAmendmentCancelled';
const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

test.describe('Notification amendment cancelled outbox event', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('writes a NotificationAmendmentCancelled event when an amendment is cancelled', async ({ seededJourney }) => {
    test.slow();
    const referenceNumber = await seededJourney.createAmendNotification();
    await seededJourney.cancelAmend(referenceNumber);

    const aggregateId = aggregateIdFor(referenceNumber);
    const amendmentCancelledFilter = { aggregateId, eventType: NOTIFICATION_AMENDMENT_CANCELLED };
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');

      await expect.poll(() => collection.countDocuments(amendmentCancelledFilter), { timeout: timeouts.long }).toBe(1);

      const [outboxEvent] = await collection.find(amendmentCancelledFilter).toArray();

      expect(outboxEvent.aggregateVersion).toBeGreaterThan(1);
      expect(outboxEvent.eventType).toBe(NOTIFICATION_AMENDMENT_CANCELLED);
      expect(outboxEvent.aggregateType).toBe('Notification');
      expect(outboxEvent.subType).toBe('GBN-AG');
      expect(outboxEvent.timestamp).toBeInstanceOf(Date);
      expect(outboxEvent.metadata.correlationId).toBeDefined();
      expect(outboxEvent.data.exchangedDocument.identifier).toBe(referenceNumber);
      expect(outboxEvent.data.exchangedDocument.notificationStatusCode).toBe('SUBMITTED');
      expect(outboxEvent.statusChanges?.map(({ status }) => status)).toEqual(['DRAFT', 'SUBMITTED', 'AMEND', 'SUBMITTED']);
    } finally {
      await client.close();
    }
  });
});

import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_WITHDRAWN = 'uk.gov.defra.imports.notification.NotificationWithdrawn';
const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

test.describe('Notification withdrawal outbox event', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('does not write a withdrawn event when a draft is deleted', async ({ journey, journeyContext, notificationActions }) => {
    test.slow();
    await journey.startNotification();
    await notificationActions.deleteNotification(journeyContext.journeyId);

    const aggregateId = aggregateIdFor(journeyContext.journeyId);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_WITHDRAWN }), {
          timeout: timeouts.short,
        })
        .toBe(0);
    } finally {
      await client.close();
    }
  });
});

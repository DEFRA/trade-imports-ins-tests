import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Seeded and browser-driven notifications match', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the comparison reads both stored documents from Mongo, which only the compose stack exposes');
  });

  test('a seeded notification stores what the same journey stores through the browser', async ({
    journey,
    journeyContext,
    seededJourney,
  }) => {
    await journey.submitNotification();
    const browserReference = journeyContext.journeyId;
    const seededReference = await seededJourney.createSubmittedNotification();

    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      const readStoredNotification = async (referenceNumber: string | undefined): Promise<NotificationDocument> => {
        await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);
        const [storedNotification] = await collection.find({ referenceNumber }).toArray();
        return storedNotification;
      };

      const browserDoc = await readStoredNotification(browserReference);
      const seededDoc = await readStoredNotification(seededReference);

      expect(seededDoc.status).toBe(browserDoc.status);
      // Keep ARRIVAL_DATE (flows/journey.ts) and MONTHS_AHEAD_INSIDE_ARRIVAL_WINDOW (domain/fixtures/seeded-journey.ts) on the same offset.
      expect(seededDoc.notification).toEqual(browserDoc.notification);
      expect(seededDoc.fulfilments).toEqual(browserDoc.fulfilments);
    } finally {
      await client.close();
    }
  });
});

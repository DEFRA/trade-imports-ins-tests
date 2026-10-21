import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { ALL_DATA_ANSWERS_WITHOUT_DOCUMENT } from '@domain/animals/constants/journey-options';
import { type NotificationDocument } from '@domain/animals/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Seeded and browser-driven notifications match', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the comparison reads both stored documents from Mongo, which only the compose stack exposes');
  });

  const readStoredNotification = async (client: MongoDbClient, referenceNumber: string | undefined): Promise<NotificationDocument> => {
    const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
    await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);
    const [storedNotification] = await collection.find({ referenceNumber }).toArray();
    return storedNotification;
  };

  test('a seeded notification stores what the same mandatory-only journey stores through the browser', async ({
    animalsJourney,
    journeyContext,
    animalsSeededJourney,
  }) => {
    test.slow();
    await animalsJourney.submitNotification();
    const browserReference = journeyContext.referenceNumber;
    const seededReference = await animalsSeededJourney.createSubmittedNotification();

    const client = new MongoDbClient();
    try {
      await client.connect();
      const browserDoc = await readStoredNotification(client, browserReference);
      const seededDoc = await readStoredNotification(client, seededReference);

      expect(seededDoc.status).toBe(browserDoc.status);
      expect(seededDoc.notification).toEqual(browserDoc.notification);
      expect(seededDoc.fulfilments).toEqual(browserDoc.fulfilments);
    } finally {
      await client.close();
    }
  });

  test('a seeded notification stores what the same all-data-without-document journey stores through the browser', async ({
    animalsJourney,
    journeyContext,
    animalsSeededJourney,
  }) => {
    test.slow();
    await animalsJourney.submitNotification(ALL_DATA_ANSWERS_WITHOUT_DOCUMENT);
    const browserReference = journeyContext.referenceNumber;
    const seededReference = await animalsSeededJourney.createSubmittedNotification(ALL_DATA_ANSWERS_WITHOUT_DOCUMENT);

    const client = new MongoDbClient();
    try {
      await client.connect();
      const browserDoc = await readStoredNotification(client, browserReference);
      const seededDoc = await readStoredNotification(client, seededReference);

      expect(seededDoc.status).toBe(browserDoc.status);
      expect(seededDoc.notification).toEqual(browserDoc.notification);
      expect(seededDoc.fulfilments).toEqual(browserDoc.fulfilments);
    } finally {
      await client.close();
    }
  });
});

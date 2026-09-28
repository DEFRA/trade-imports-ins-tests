import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type OutboxEventActor, type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';
import { users } from '@config/users';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_AMENDMENT_REQUESTED = 'uk.gov.defra.imports.notification.NotificationAmendmentRequested';
const EXPECTED_ACTOR: OutboxEventActor = {
  id: users.andrew.crn,
  source: 'dynamics-contact',
  userType: 'B2C',
  displayName: users.andrew.displayName,
  organisationId: users.andrew.organisationId,
  onBehalfOfOrganisationId: null,
};

const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

const actorWithNullableFields = (actor?: OutboxEventActor | null): OutboxEventActor => ({
  id: actor?.id ?? null,
  source: actor?.source ?? null,
  userType: actor?.userType ?? null,
  displayName: actor?.displayName ?? null,
  organisationId: actor?.organisationId ?? null,
  onBehalfOfOrganisationId: actor?.onBehalfOfOrganisationId ?? null,
});

test.describe('Notification amendment outbox event', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('records the authenticated actor and cumulative status changes on amendment', async ({
    journey,
    journeyContext,
    notificationActions,
  }) => {
    test.slow();
    await journey.submitNotification();
    await notificationActions.amendNotification(journeyContext.journeyId);

    const aggregateId = aggregateIdFor(journeyContext.journeyId);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_AMENDMENT_REQUESTED }), { timeout: timeouts.long })
        .toBe(1);

      const events = await collection.find({ aggregateId, eventType: NOTIFICATION_AMENDMENT_REQUESTED }).toArray();
      const [amended] = events;
      const statusChanges = amended.statusChanges ?? [];

      expect(amended.aggregateVersion).toBeGreaterThan(1);
      expect(amended.eventType).toBe(NOTIFICATION_AMENDMENT_REQUESTED);
      expect(amended.data.exchangedDocument.notificationStatusCode).toBe('AMEND');
      expect(actorWithNullableFields(amended.actor)).toEqual(EXPECTED_ACTOR);
      expect(statusChanges).toHaveLength(3);
      expect(statusChanges.map(({ status }) => status)).toEqual(['DRAFT', 'SUBMITTED', 'AMEND']);
      expect(statusChanges.map(({ dateChanged }) => dateChanged)).toEqual([expect.any(Date), expect.any(Date), expect.any(Date)]);
      expect(actorWithNullableFields(statusChanges[1].actor)).toEqual(EXPECTED_ACTOR);
      expect(actorWithNullableFields(statusChanges[2].actor)).toEqual(EXPECTED_ACTOR);
    } finally {
      await client.close();
    }
  });
});

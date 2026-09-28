import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type OutboxEventActor, type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { CONSIGNOR_NAME } from '@domain/constants/journey-options';
import { timeouts } from '@config/timeouts';
import { users } from '@config/users';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const REFERENCE_NUMBER_PATTERN = /GBN-AG-\d{2}-[0-9A-Z]{6}/;
const CONSIGNOR_ADDRESS_LINE = '43 East Hague Extension';
const CONSIGNOR_CITY = 'Bern';
const CONSIGNOR_POSTCODE = '30055';

const NOTIFICATION_CREATED = 'uk.gov.defra.imports.notification.NotificationCreated';
const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

const EXPECTED_ACTOR: OutboxEventActor = {
  id: users.andrew.crn,
  source: 'dynamics-contact',
  userType: 'B2C',
  displayName: users.andrew.displayName,
  organisationId: users.andrew.organisationId,
  onBehalfOfOrganisationId: null,
};

const actorWithNullableFields = (actor?: OutboxEventActor | null): OutboxEventActor => ({
  id: actor?.id ?? null,
  source: actor?.source ?? null,
  userType: actor?.userType ?? null,
  displayName: actor?.displayName ?? null,
  organisationId: actor?.organisationId ?? null,
  onBehalfOfOrganisationId: actor?.onBehalfOfOrganisationId ?? null,
});

test.describe('Notification created outbox event', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('writes a NotificationCreated event immediately on draft creation', async ({ journey, journeyContext }) => {
    test.slow();
    await journey.startNotification();
    const referenceNumber = journeyContext.journeyId;
    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');

      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_CREATED }), { timeout: timeouts.long })
        .toBe(1);

      const [doc] = await collection.find({ aggregateId, eventType: NOTIFICATION_CREATED }).toArray();

      expect(doc._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(doc.aggregateVersion).toBe(1);
      expect(doc.eventType).toBe(NOTIFICATION_CREATED);
      expect(doc.aggregateType).toBe('Notification');
      expect(doc.subType).toBe('GBN-AG');
      expect(doc.timestamp).toBeInstanceOf(Date);
      expect(doc.metadata.schemaVersion).toBe('1');
      expect(doc.metadata.correlationId).toBeDefined();
      expect(doc.data.exchangedDocument.identifier).toBe(referenceNumber);
      expect(doc.data.exchangedDocument.notificationStatusCode).toBe('DRAFT');
      expect(doc.data.exchangedDocument.versionId).toBeUndefined();
      expect(actorWithNullableFields(doc.actor)).toEqual(EXPECTED_ACTOR);
      expect(doc.statusChanges).toHaveLength(1);
      expect(doc.statusChanges?.[0].status).toBe('DRAFT');
      expect(doc.statusChanges?.[0].dateChanged).toEqual(expect.any(Date));
    } finally {
      await client.close();
    }
  });

  test('writes a NotificationCreated event with consignor name when a submitted notification is copied', async ({
    seededJourney,
    notificationActions,
    pages,
    journeyContext,
  }) => {
    test.slow();
    await seededJourney.createSubmittedNotification();
    const sourceReferenceNumber = journeyContext.journeyId;
    await notificationActions.toNotificationView(sourceReferenceNumber);
    await pages.notificationView.btnCopyAsNew.click();
    await pages.overview.heading.waitFor();

    const copiedReferenceNumber = (await pages.notificationView.referenceNumberCaption.textContent())?.match(REFERENCE_NUMBER_PATTERN)?.[0];
    expect(copiedReferenceNumber).toBeDefined();
    expect(copiedReferenceNumber).not.toEqual(sourceReferenceNumber);

    const aggregateId = aggregateIdFor(copiedReferenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');

      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_CREATED }), { timeout: timeouts.long })
        .toBe(1);

      const [doc] = await collection.find({ aggregateId, eventType: NOTIFICATION_CREATED }).toArray();

      expect(doc.data.specifiedConsignment.consignorParty).toMatchObject({
        name: CONSIGNOR_NAME,
        postalAddress: {
          lineOne: CONSIGNOR_ADDRESS_LINE,
          cityName: CONSIGNOR_CITY,
          postcodeCode: CONSIGNOR_POSTCODE,
        },
      });
    } finally {
      await client.close();
    }
  });
});

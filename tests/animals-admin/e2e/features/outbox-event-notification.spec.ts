import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { defaultJourneyOptions, CONSIGNOR_NAME, CPH_NUMBER } from '@domain/constants/journey-options';
import { type OutboxEventActor, type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';
import { users } from '@config/users';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_SUBMITTED = 'uk.gov.defra.imports.notification.NotificationSubmitted';
const POINT_OF_ENTRY = 'GB ABD';
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

test.describe('Notification outbox event', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('records a NotificationSubmitted outbox event on UI submission', async ({ journey, journeyContext }) => {
    test.slow();
    await journey.submitNotification();
    const referenceNumber = journeyContext.journeyId;
    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_SUBMITTED }), { timeout: timeouts.long })
        .toBe(1);

      const docs = await collection.find({ aggregateId, eventType: NOTIFICATION_SUBMITTED }).toArray();
      const [doc] = docs;
      const data = doc.data;
      const statusChanges = doc.statusChanges ?? [];

      expect(doc._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(doc.aggregateId).toBe(aggregateId);
      expect(doc.aggregateType).toBe('Notification');
      expect(doc.subType).toBe('GBN-AG');
      expect(doc.eventType).toBe(NOTIFICATION_SUBMITTED);
      expect(doc.timestamp).toBeInstanceOf(Date);
      expect(doc.metadata.schemaVersion).toBe('1');
      expect(doc.metadata.correlationId).toBeDefined();
      expect(data.$model).toBe('defra/certificate-internal/1');
      expect(data.$type).toBe('gbn-ag');
      expect(data.exchangedDocument.identifier).toBe(referenceNumber);
      expect(data.exchangedDocument.notificationStatusCode).toBe('SUBMITTED');
      expect(data.specifiedConsignment.consignorParty?.name).toBe(CONSIGNOR_NAME);
      expect(data.specifiedConsignment.originCountry?.code?.value).toBe(defaultJourneyOptions.countryCode.value);
      expect(data.specifiedConsignment.unloadingBaseportLocation?.identifier).toBe(POINT_OF_ENTRY);
      expect(data.specifiedConsignment.includedConsignmentItem).toHaveLength(1);
      // The journey answers the region, CPH, transport and animal questions, so each reaches the event.
      const region = data.specifiedConsignment.originCountry?.subordinateTradeCountrySubDivision;
      expect(region?.identifier).toBe('FR-75');
      expect(region?.functionTypeCode?.content).toBe('106');
      expect(data.specifiedConsignment.finalDestinationLocation?.identifier).toBe(CPH_NUMBER);
      expect(data.specifiedConsignment.finalDestinationLocation?.urlId).toBe('https://refdata.tbc.defra.gov.uk/cph_number');
      const transitCountries = data.specifiedConsignment.transitTradeCountry ?? [];
      expect(transitCountries).toHaveLength(2);
      expect(transitCountries[0].code?.value).toBe('FR');
      expect(transitCountries[1].code?.value).toBe('BE');
      const [movement] = data.specifiedConsignment.mainCarriageLogisticsTransportMovement ?? [];
      const [transportDocument] = movement.transportContractRelatedReferencedDocument ?? [];
      expect(transportDocument.typeCode).toBe('730'); // road consignment note, as the journey travels by road
      expect(transportDocument.identifier).toBe('CMR-2026-884721');
      const tradeLines = data.specifiedConsignment.includedConsignmentItem?.[0].includedTradeLineItem ?? [];
      expect(tradeLines).toHaveLength(1);
      const [line] = tradeLines;
      expect(line.description).toEqual(['Cow']);
      expect(line.commonName).toBe('Cow');
      expect(line.scientificName).toBe('Bos taurus');
      expect(line.specifiedLineTradeDelivery?.[0].productUnitQuantity.content).toBe(1);
      expect(line.physicalReferencedLogisticsPackage?.[0].itemQuantity).toBe(5);
      const animals = line.individualTradeProductInstance ?? [];
      expect(animals).toHaveLength(1);
      // The journey leaves the passport unanswered, so only the ear tag is sent.
      expect(animals[0].identifier).toHaveLength(1);
      expect(animals[0].identifier?.[0].typeCode).toBe('EAR_TAG');
      expect(animals[0].identifier?.[0].content).toBe('UK123456789012');
      expect(actorWithNullableFields(doc.actor)).toEqual(EXPECTED_ACTOR);
      expect(statusChanges).toHaveLength(2);
      expect(statusChanges[0].status).toBe('DRAFT');
      expect(statusChanges[0].dateChanged).toEqual(expect.any(Date));
      expect(statusChanges[1].status).toBe('SUBMITTED');
      expect(statusChanges[1].dateChanged).toEqual(expect.any(Date));
      expect(actorWithNullableFields(statusChanges[1].actor)).toEqual(EXPECTED_ACTOR);
    } finally {
      await client.close();
    }
  });
});

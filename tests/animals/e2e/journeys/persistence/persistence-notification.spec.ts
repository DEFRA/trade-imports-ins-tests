import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { ARRIVAL_DATE } from '@flows/journey';
import { toUtcDate } from '@utils/date-utils';

/**
 * Integration seam: real UI-create -> backend/Mongo persistence -> reload.
 *
 * The frontend Mapper A contract units (frontend repo) pin the exact payload shape; this seam proves the
 * round-trip end to end — the journey's answers survive to Mongo and the persisted notification re-renders.
 * Assertions cover a representative field per section rather than every field.
 */
test.describe('Notification persistence round-trip', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('draft notification persists as DRAFT up to declaration', async ({ journey, journeyContext }) => {
    await journey.toDeclaration();
    const referenceNumber = journeyContext.journeyId;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      expect(doc.referenceNumber).toBe(referenceNumber);
      expect(doc.status).toBe('DRAFT');
    } finally {
      await client.close();
    }
  });

  test('submitted notification persists the journey answers and reloads read-only', async ({
    journey,
    journeyContext,
    pages,
    addressBookApi,
  }) => {
    // Resolve linked ids from the once-seeded journey fixtures (API globalSetup),
    // not hard-coded Mongo ObjectIds — a role mix-up or the same id on every party
    // would otherwise pass if we only asserted "some string" (EUDPA-294 AC3).
    const consignor = await addressBookApi.findByName('Astra Rosales');
    const destination = await addressBookApi.findByName('Tech Imports Ltd');
    const placeOfOrigin = await addressBookApi.findByName('Origin Farm');
    const consignee = await addressBookApi.findByName('British Livestock Ltd');
    const importer = await addressBookApi.findByName('Import Co UK');
    const contact = await addressBookApi.findByName('Animal and Plant Health Agency');

    await journey.submitNotification();
    const referenceNumber = journeyContext.journeyId;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      // Content fields live under doc.notification.* after the aggregate refactor
      // (EUDPA-335). Aggregate-level fields — referenceNumber, status, fulfilments
      // — stay at the document root.
      const { notification } = doc;
      const [complement] = notification.commodity.commodityComplement;
      const [species] = complement.species;

      expect(doc.referenceNumber).toBe(referenceNumber);
      expect(doc.status).toBe('SUBMITTED');
      expect(notification.origin.countryCode).toBe('FR');
      expect(notification.origin.requiresRegionCode).toBe('yes');
      expect(notification.origin.regionOfOriginCode).toBe('FR-75');
      expect(notification.origin.internalReference).toBe('Imports456GB');
      expect(notification.commodity.name).toBe('Cow');
      expect(species.text).toBe('Bos taurus');
      expect(species.earTag).toBe('UK123456789012');
      // animalIdentification only fills earTag on this journey; passport is submitted
      // as an empty string rather than omitted, matching the legacy earTag/passport
      // scalars' own behaviour on this same fixture.
      expect(species.animalIdentifiers).toEqual([{ earTag: 'UK123456789012', passport: '' }]);
      expect(complement.totalNoOfAnimals).toBe(1);
      expect(complement.totalNoOfPackages).toBe(5);
      expect(notification.reasonForImport).toBe('internalMarket');
      expect(notification.purposeInInternalMarket).toBe('breeding');
      expect(notification.additionalDetails.certifiedFor).toBe('slaughter');
      expect(notification.additionalDetails.unweanedAnimals).toBe('no');
      // Every party carries inline details after submit — the freeze lives on the
      // top-level notification fields, not a separate amend-scoped snapshot.
      expect(notification.consignor).toMatchObject({
        addressId: consignor.id,
        name: consignor.name,
        email: consignor.email,
        phone: consignor.phone,
        address: {
          addressLine1: consignor.addressLine1,
          townOrCity: consignor.townOrCity,
          postcode: consignor.postcode,
          countryCode: consignor.countryCode,
        },
      });
      expect(notification.destination).toMatchObject({ addressId: destination.id, name: destination.name });
      expect(notification.consignee).toMatchObject({ addressId: consignee.id, name: consignee.name });
      expect(notification.importer).toMatchObject({ addressId: importer.id, name: importer.name });
      expect(notification.placeOfOrigin).toMatchObject({ addressId: placeOfOrigin.id, name: placeOfOrigin.name });
      expect(notification.consignment).toMatchObject({ addressId: contact.id, name: contact.name });
      expect(doc.preAmendNotification).toBeUndefined();
      expect(notification.cphNumber).toBe('123456789');
      expect(notification.transport.portOfEntry).toBe('GB ABD');
      expect(notification.transport.meansOfTransport).toBe('ROAD_VEHICLE');
      expect(notification.transport.transportIdentification).toBe('FR-892-LK');
      expect(notification.transport.transportDocumentReference).toBe('CMR-2026-884721');
      // Countries are added one at a time, so the list keeps the order they were added in.
      expect(notification.transport.transitedCountries).toEqual(['FR', 'BE']);
      expect(notification.transport.transporter?.name).toBe('García Livestock Transport SL');
      expect(notification.transport.transporter?.type).toBe('Commercial');
      // EUDPA-282: the stored instant must be UTC start-of-day for the chosen calendar
      // date, whatever timezone the backend JVM runs in. Asserting on the raw BSON Date
      // is what catches the drift — reading back through the API decodes with the same
      // zone that encoded it, so the bug cancels itself out and passes either way.
      // Fails by exactly 3,600,000 ms on a non-UTC backend during BST.
      const [day, month, year] = ARRIVAL_DATE.split('/');
      expect(notification.transport.arrivalDate.getTime()).toBe(toUtcDate({ day, month, year }).getTime());
    } finally {
      await client.close();
    }

    await pages.notificationView.open(referenceNumber);
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.journeyStrip).toContainText('Submitted');
  });
});

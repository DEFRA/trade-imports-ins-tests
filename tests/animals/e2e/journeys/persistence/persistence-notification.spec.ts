import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/animals/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { ARRIVAL_DATE } from '@flows/animals/journey';
import { toIsoDate } from '@utils/date-utils';

test.describe('Notification persistence round-trip', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('draft notification persists as DRAFT up to declaration', async ({ animalsJourney, journeyContext }) => {
    test.slow();
    await animalsJourney.toDeclaration();
    const referenceNumber = journeyContext.referenceNumber;
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
    animalsJourney,
    journeyContext,
    animalsPages,
    addressBookApi,
  }) => {
    test.slow();
    const consignor = await addressBookApi.findByName('Astra Rosales');
    const destination = await addressBookApi.findByName('Tech Imports Ltd');
    const placeOfOrigin = await addressBookApi.findByName('Origin Farm');
    const consignee = await addressBookApi.findByName('British Livestock Ltd');
    const importer = await addressBookApi.findByName('Import Co UK');
    const contact = await addressBookApi.findByName('Animal and Plant Health Agency');

    await animalsJourney.submitNotification();
    const referenceNumber = journeyContext.referenceNumber;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      const { notification } = doc;
      const [complement] = notification.commodity.commodityComplement;
      const [species] = complement.species;

      expect(doc.referenceNumber).toBe(referenceNumber);
      expect(doc.status).toBe('SUBMITTED');
      expect(notification.origin.countryCode).toBe('FR');
      expect(notification.origin.requiresRegionCode).toBe('yes');
      expect(notification.origin.regionOfOriginCode).toBe('FR-75');
      expect(notification.origin.internalReference).toBe('Imports456GB');
      expect(notification.commodity.name).toBe(commodityLines.cattle.commodityCode);
      expect(species.text).toBe(commodityLines.cattle.latinName);
      expect(species.earTag).toBe('UK123456789012');
      expect(species.animalIdentifiers).toEqual([{ earTag: 'UK123456789012', passport: '' }]);
      expect(complement.totalNoOfAnimals).toBe(1);
      expect(complement.totalNoOfPackages).toBe(5);
      expect(notification.reasonForImport).toBe('internalMarket');
      expect(notification.purposeInInternalMarket).toBe('breeding');
      expect(notification.additionalDetails.certifiedFor).toBe('slaughter');
      expect(notification.additionalDetails.unweanedAnimals).toBe('no');
      expect(notification.consignor).not.toHaveProperty('addressId');
      expect(notification.consignor).toMatchObject({
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
      expect(notification.destination).toMatchObject({ name: destination.name, address: { postcode: destination.postcode } });
      expect(notification.consignee).toMatchObject({ name: consignee.name, address: { postcode: consignee.postcode } });
      expect(notification.importer).toMatchObject({ name: importer.name, address: { postcode: importer.postcode } });
      expect(notification.placeOfOrigin).toMatchObject({ name: placeOfOrigin.name, address: { postcode: placeOfOrigin.postcode } });
      expect(notification.consignment).toMatchObject({ name: contact.name, address: { postcode: contact.postcode } });
      expect(doc.preAmendNotification).toBeUndefined();
      expect(notification.cphNumber).toBe('123456789');
      expect(notification.transport.portOfEntry).toBe('GB ABD');
      expect(notification.transport.meansOfTransport).toBe('ROAD_VEHICLE');
      expect(notification.transport.transportIdentification).toBe('FR-892-LK');
      expect(notification.transport.transportDocumentReference).toBe('CMR-2026-884721');
      expect(notification.transport.transitedCountries).toEqual(['FR', 'BE']);
      expect(notification.transport.transporter?.name).toBe('García Livestock Transport SL');
      expect(notification.transport.transporter?.type).toBe('Commercial');
      // Read from the raw document: a timezone drift would cancel itself out on a round trip through the API.
      const [day, month, year] = ARRIVAL_DATE.split('/');
      expect(notification.transport.arrivalDate).toBe(toIsoDate({ day, month, year }));
    } finally {
      await client.close();
    }

    await animalsPages.notificationView.open(referenceNumber);
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
  });
});

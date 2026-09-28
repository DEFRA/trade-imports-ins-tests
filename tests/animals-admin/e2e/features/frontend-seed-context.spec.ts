import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { CREATE_PATH } from '@flows/seeded-journey';

const CREATED_AT_ORIGIN = new RegExp(`^${CREATE_PATH}/([^/]+)/origin$`);

// Matched against the set base rather than read from a fixed path segment: the
// set prefix shifts every index by one, and `split('/')[2]` answered
// "notifications" rather than failing, which surfaced later as a 500 on a
// doubled path.
const referenceNumberFrom = (redirectPath: string): string => {
  const match = redirectPath.match(CREATED_AT_ORIGIN);
  if (!match) {
    throw new Error(`Expected a redirect to the origin page under ${CREATE_PATH}, got "${redirectPath}".`);
  }
  return match[1];
};

// Auth state is minted per Playwright project, so this proof only holds from the admin
// project: an e2e-project session is already a frontend session.
test.describe('Frontend seed context', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the seed proof asserts on Mongo directly, which only the compose stack exposes');
  });

  test('seeds an origin answer into the notification document from an admin-project spec', async ({ frontendForms }) => {
    const created = await frontendForms.postForm(CREATE_PATH);
    expect(created).toMatch(CREATED_AT_ORIGIN);

    const referenceNumber = referenceNumberFrom(created);
    await frontendForms.postForm(`${CREATE_PATH}/${referenceNumber}/origin`, {
      countryOfOrigin: 'FR',
      regionOfOriginCodeRequirement: 'no',
      regionOfOriginCodeSuffix: '',
      internalReferenceNumber: 'Imports456GB',
    });

    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      expect(doc.notification.origin).toEqual({
        countryCode: 'FR',
        requiresRegionCode: 'no',
        regionOfOriginCode: '',
        internalReference: 'Imports456GB',
      });
      expect(doc.fulfilments?.length).toBeGreaterThan(0);
    } finally {
      await client.close();
    }
  });

  test('refuses a page the frontend rejected, rather than seeding half a notification', async ({ frontendForms }) => {
    const created = await frontendForms.postForm(CREATE_PATH);
    const referenceNumber = referenceNumberFrom(created);

    await expect(frontendForms.postForm(`${CREATE_PATH}/${referenceNumber}/origin`, { countryOfOrigin: 'Narnia' })).rejects.toThrow(
      /responded 400/,
    );
  });

  test('seeds a complete journey into every section of the notification document', async ({ seededJourney, addressBookApi }) => {
    const consignor = await addressBookApi.findByName('Astra Rosales');
    const placeOfOrigin = await addressBookApi.findByName('Origin Farm');

    const referenceNumber = await seededJourney.createDraftNotification('readyToSubmit');

    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      const { notification } = doc;
      const [complement] = notification.commodity.commodityComplement;
      const [species] = complement.species;

      expect(doc.status).toBe('DRAFT');
      expect(notification.origin.countryCode).toBe('FR');
      expect(species.earTag).toBe('UK123456789012');
      expect(complement.totalNoOfAnimals).toBe(1);
      expect(notification.reasonForImport).toBe('internalMarket');
      expect(notification.additionalDetails.unweanedAnimals).toBe('no');
      expect(notification.consignor?.addressId).toBe(consignor.id);
      expect(notification.placeOfOrigin?.addressId).toBe(placeOfOrigin.id);
      expect(notification.placeOfOrigin?.address?.postcode).toBe(placeOfOrigin.postcode);
      expect(notification.cphNumber).toBe('123456789');
      expect(notification.transport.portOfEntry).toBe('GB ABD');
      expect(notification.transport.arrivalDate).toBeDefined();
      expect(notification.transport.transporter?.approvalNumber).toBe('ES-T2-45001294');
      expect(notification.consignment?.name).toBe('Animal and Plant Health Agency');
    } finally {
      await client.close();
    }
  });
});

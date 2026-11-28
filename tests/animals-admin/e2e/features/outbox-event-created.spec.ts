import { notificationStatuses } from '@domain/animals/models/api/notification-status';
import { NOTIFICATION_CREATED, NOTIFICATION_EDITED } from '@domain/animals/models/db/outbox-event-document';
import { test, expect } from '@fixtures';
import { actorWithNullableFields, EXPECTED_ACTOR, withOutbox } from '@flows/animals/outbox';
import { consignorFixture } from '@flows/shared/address-book-seed';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const REFERENCE_NUMBER_PATTERN = /GBN-AG-\d{2}-[0-9A-Z]{6}/;

test.describe('Notification created outbox event', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('writes a NotificationCreated event on draft creation', async ({ animalsJourney, journeyContext }) => {
    test.slow();
    await animalsJourney.startNotification();
    const referenceNumber = journeyContext.referenceNumber;

    const doc = await withOutbox((outbox) => outbox.singleEventOf(referenceNumber, NOTIFICATION_CREATED));

    expect(doc._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(doc.aggregateVersion).toBe(1);
    expect(doc.aggregateType).toBe('Notification');
    expect(doc.subType).toBe('GBN-AG');
    expect(doc.timestamp).toBeInstanceOf(Date);
    expect(doc.metadata.schemaVersion).toBe('1');
    expect(doc.metadata.correlationId).toBeDefined();
    expect(doc.data.exchangedDocument.identifier).toBe(referenceNumber);
    expect(doc.data.exchangedDocument.notificationStatusCode).toBe(notificationStatuses.draft);
    expect(doc.data.exchangedDocument.versionId).toBeUndefined();
    expect(actorWithNullableFields(doc.actor)).toEqual(EXPECTED_ACTOR);
    expect(doc.statusChanges).toHaveLength(1);
    expect(doc.statusChanges?.[0].status).toBe(notificationStatuses.draft);
    expect(doc.statusChanges?.[0].dateChanged).toEqual(expect.any(Date));
  });

  test('writes a draft NotificationCreated event with no copied detail, then a NotificationEdited event carrying the source consignor, when a submitted notification is copied', async ({
    animalsSeededJourney,
    animalsNotificationActions,
    animalsPages,
    journeyContext,
  }) => {
    test.slow();
    await animalsSeededJourney.createSubmittedNotification();
    const sourceReferenceNumber = journeyContext.referenceNumber;
    await animalsNotificationActions.toNotificationView(sourceReferenceNumber);
    await animalsPages.notificationView.viewHeader.btnCopy.click();
    await animalsPages.overview.heading.waitFor();

    const copiedReferenceNumber = (await animalsPages.notificationView.journeyStrip.textContent())?.match(REFERENCE_NUMBER_PATTERN)?.[0];
    expect(copiedReferenceNumber).toBeDefined();
    expect(copiedReferenceNumber).not.toEqual(sourceReferenceNumber);

    const created = await withOutbox((outbox) => outbox.singleEventOf(copiedReferenceNumber, NOTIFICATION_CREATED));
    expect(created.data.exchangedDocument.notificationStatusCode).toBe(notificationStatuses.draft);
    expect(created.data.specifiedConsignment?.consignorParty).toBeNull();

    const edited = await withOutbox((outbox) => outbox.singleEventOf(copiedReferenceNumber, NOTIFICATION_EDITED));
    expect(edited.data.specifiedConsignment.consignorParty).toMatchObject({
      name: consignorFixture.name,
      postalAddress: {
        lineOne: consignorFixture.addressLine1,
        cityName: consignorFixture.townOrCity,
        postcodeCode: consignorFixture.postcode,
      },
    });
  });
});

import { notificationStatuses } from '@domain/animals/models/api/notification-status';
import { NOTIFICATION_DELETED } from '@domain/animals/models/db/outbox-event-document';
import { test, expect } from '@fixtures';
import { withOutbox } from '@flows/animals/outbox';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_SUBMISSION_DELETED = 'uk.gov.defra.imports.notification.NotificationSubmissionDeleted';

test.describe('Notification deleted outbox events', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('writes a NotificationDeleted event when a draft is soft-deleted', async ({ animalsSeededJourney }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createEmptyNotification();
    await animalsSeededJourney.softDelete(referenceNumber);

    const doc = await withOutbox((outbox) => outbox.singleEventOf(referenceNumber, NOTIFICATION_DELETED));

    expect(doc.aggregateType).toBe('Notification');
    expect(doc.subType).toBe('GBN-AG');
    expect(doc.timestamp).toBeInstanceOf(Date);
    expect(doc.metadata.correlationId).toBeDefined();
    expect(doc.data.exchangedDocument.identifier).toBe(referenceNumber);
    expect(doc.data.exchangedDocument.notificationStatusCode).toBe(notificationStatuses.deleted);
    expect(doc.data.exchangedDocument.versionId).toBeUndefined();
  });

  test('writes a NotificationSubmissionDeleted event when a submitted notification is soft-deleted', async ({ animalsSeededJourney }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();
    await animalsSeededJourney.softDelete(referenceNumber);

    const doc = await withOutbox((outbox) => outbox.singleEventOf(referenceNumber, NOTIFICATION_SUBMISSION_DELETED));

    expect(doc.aggregateType).toBe('Notification');
    expect(doc.subType).toBe('GBN-AG');
    expect(doc.timestamp).toBeInstanceOf(Date);
    expect(doc.metadata.correlationId).toBeDefined();
    expect(doc.data.exchangedDocument.identifier).toBe(referenceNumber);
    expect(doc.data.exchangedDocument.notificationStatusCode).toBe(notificationStatuses.deleted);
    expect(doc.data.exchangedDocument.versionId).toBe(1);
    expect(doc.statusChanges?.map(({ status }) => status)).toEqual([
      notificationStatuses.draft,
      notificationStatuses.submitted,
      notificationStatuses.deleted,
    ]);
  });
});

import { notificationStatuses } from '@domain/animals/models/api/notification-status';
import { test, expect } from '@fixtures';
import { withOutbox } from '@domain/animals/models/db/outbox-event-document';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_AMENDMENT_CANCELLED = 'uk.gov.defra.imports.notification.NotificationAmendmentCancelled';

test.describe('Notification amendment cancelled outbox event', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('writes a NotificationAmendmentCancelled event when an amendment is cancelled', async ({ animalsSeededJourney }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createAmendNotification();
    await animalsSeededJourney.cancelAmend(referenceNumber);

    const outboxEvent = await withOutbox((outbox) => outbox.singleEventOf(referenceNumber, NOTIFICATION_AMENDMENT_CANCELLED));

    expect(outboxEvent.aggregateVersion).toBeGreaterThan(1);
    expect(outboxEvent.aggregateType).toBe('Notification');
    expect(outboxEvent.subType).toBe('GBN-AG');
    expect(outboxEvent.timestamp).toBeInstanceOf(Date);
    expect(outboxEvent.metadata.correlationId).toBeDefined();
    expect(outboxEvent.data.exchangedDocument.identifier).toBe(referenceNumber);
    expect(outboxEvent.data.exchangedDocument.notificationStatusCode).toBe(notificationStatuses.submitted);
    expect(outboxEvent.statusChanges?.map(({ status }) => status)).toEqual([
      notificationStatuses.draft,
      notificationStatuses.submitted,
      notificationStatuses.amend,
      notificationStatuses.submitted,
    ]);
  });
});

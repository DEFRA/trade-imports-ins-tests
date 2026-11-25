import { test, expect } from '@fixtures';
import { withOutbox } from '@domain/animals/models/db/outbox-event-document';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_CREATED = 'uk.gov.defra.imports.notification.NotificationCreated';
const NOTIFICATION_EDITED = 'uk.gov.defra.imports.notification.NotificationEdited';
const NOTIFICATION_DELETED = 'uk.gov.defra.imports.notification.NotificationDeleted';

test.describe('Notification withdrawal outbox event', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('does not write a withdrawn event when a draft is deleted', async ({
    animalsJourney,
    journeyContext,
    animalsNotificationActions,
  }) => {
    test.slow();
    await animalsJourney.startNotification();
    await animalsNotificationActions.deleteNotification(journeyContext.referenceNumber);

    await withOutbox(async (outbox) => {
      await outbox.singleEventOf(journeyContext.referenceNumber, NOTIFICATION_DELETED);

      const events = await outbox.eventsOf(journeyContext.referenceNumber);
      expect(events.map(({ eventType }) => eventType)).toEqual([NOTIFICATION_CREATED, NOTIFICATION_EDITED, NOTIFICATION_DELETED]);
    });
  });
});

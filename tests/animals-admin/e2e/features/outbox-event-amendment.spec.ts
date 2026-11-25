import { notificationStatuses } from '@domain/animals/models/api/notification-status';
import { test, expect } from '@fixtures';
import { actorWithNullableFields, EXPECTED_ACTOR, withOutbox } from '@domain/animals/models/db/outbox-event-document';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_AMENDMENT_REQUESTED = 'uk.gov.defra.imports.notification.NotificationAmendmentRequested';

test.describe('Notification amendment outbox event', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('records the authenticated actor and cumulative status changes on amendment', async ({
    animalsJourney,
    journeyContext,
    animalsNotificationActions,
  }) => {
    test.slow();
    await animalsJourney.submitNotification();
    await animalsNotificationActions.amendNotification(journeyContext.referenceNumber);

    const amended = await withOutbox((outbox) => outbox.singleEventOf(journeyContext.referenceNumber, NOTIFICATION_AMENDMENT_REQUESTED));
    const statusChanges = amended.statusChanges ?? [];

    expect(amended.aggregateVersion).toBeGreaterThan(1);
    expect(amended.data.exchangedDocument.notificationStatusCode).toBe(notificationStatuses.amend);
    expect(actorWithNullableFields(amended.actor)).toEqual(EXPECTED_ACTOR);
    expect(statusChanges).toHaveLength(3);
    expect(statusChanges.map(({ status }) => status)).toEqual([
      notificationStatuses.draft,
      notificationStatuses.submitted,
      notificationStatuses.amend,
    ]);
    expect(statusChanges.map(({ dateChanged }) => dateChanged)).toEqual([expect.any(Date), expect.any(Date), expect.any(Date)]);
    expect(actorWithNullableFields(statusChanges[1].actor)).toEqual(EXPECTED_ACTOR);
    expect(actorWithNullableFields(statusChanges[2].actor)).toEqual(EXPECTED_ACTOR);
  });
});

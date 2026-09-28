import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';
import { type AnimalsAdminOutboxEventsPage } from '@page-objects/animals-admin/outbox-events-page';

const EVENT_PREFIX = 'uk.gov.defra.imports.notification';
const EDITED_EVENT_FRAGMENT = 'Edited';
const LIFECYCLE_MILESTONES = [
  `${EVENT_PREFIX}.NotificationCreated`,
  `${EVENT_PREFIX}.NotificationSubmitted`,
  `${EVENT_PREFIX}.NotificationAmendmentRequested`,
];

const milestonesOf = (eventTypes: string[]): string[] => eventTypes.filter((eventType) => !eventType.includes(EDITED_EVENT_FRAGMENT));

const eventTypesOn = async (outboxEvents: AnimalsAdminOutboxEventsPage): Promise<string[]> =>
  (await outboxEvents.eventTypeCells.allTextContents()).map((eventType) => eventType.trim());

test.describe('Outbox event replay', { tag: ['@compose', '@integration'] }, () => {
  test.beforeEach(async ({ animalsSeededJourney }) => {
    await animalsSeededJourney.createAmendNotification();
  });

  test('replays outbox events and shows success banner', async ({ animalsAdminNavigation, animalsAdminPages, journeyContext }) => {
    await animalsAdminNavigation.toOutboxEvents(journeyContext.referenceNumber);

    await test.step('lists the notification lifecycle before replay', async () => {
      await expect
        .poll(async () => milestonesOf(await eventTypesOn(animalsAdminPages.outboxEvents)), { timeout: timeouts.short })
        .toEqual(LIFECYCLE_MILESTONES);
    });

    const eventCountBeforeReplay = await animalsAdminPages.outboxEvents.tableRows.count();

    await test.step('replays all events and shows success banner', async () => {
      await animalsAdminPages.outboxEvents.btnReplay.click();
      await expect(animalsAdminPages.outboxEvents.bannerSuccess).toBeVisible();
      await expect(animalsAdminPages.outboxEvents.bannerSuccess).toContainText(
        'All outbox events have been re-published to the SNS topic.',
      );
    });

    await test.step('keeps every event it replayed', async () => {
      await expect(animalsAdminPages.outboxEvents.tableRows).toHaveCount(eventCountBeforeReplay);
    });
  });

  test(
    'writes a REPLAY_EVENTS audit record covering every replayed event',
    { tag: '@mongodb' },
    async ({ animalsAdminNavigation, animalsAdminPages, journeyContext }) => {
      const { referenceNumber } = journeyContext;

      await animalsAdminNavigation.toOutboxEvents(referenceNumber);
      await expect.poll(() => animalsAdminPages.outboxEvents.tableRows.count(), { timeout: timeouts.short }).toBeGreaterThan(0);
      const replayedEventCount = await animalsAdminPages.outboxEvents.tableRows.count();

      await animalsAdminPages.outboxEvents.btnReplay.click();
      await expect(animalsAdminPages.outboxEvents.bannerSuccess).toBeVisible();

      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection('trade-imports-animals-backend', 'audit');
        const replayAuditFilter = { notificationReferenceNumbers: referenceNumber, action: 'REPLAY_EVENTS' };

        await expect.poll(() => collection.countDocuments(replayAuditFilter), { timeout: timeouts.short }).toBe(1);

        const auditRecord = await collection.findOne(replayAuditFilter);
        expect(auditRecord?.action).toBe('REPLAY_EVENTS');
        expect(auditRecord?.result).toBe('SUCCESS');
        expect(auditRecord?.notificationReferenceNumbers).toEqual([referenceNumber]);
        expect(auditRecord?.numberOfNotifications).toBe(1);
        expect(auditRecord?.numberOfEvents).toBe(replayedEventCount);
        expect(auditRecord?.userId).toBeDefined();
        expect(auditRecord?.timestamp).toBeDefined();
      } finally {
        await client.close();
      }
    },
  );
});

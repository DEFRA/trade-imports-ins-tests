import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';
import { type AdminOutboxEventsPage } from '@page-objects/admin/admin-outbox-events-page';

const EVENT_PREFIX = 'uk.gov.defra.imports.notification';
const EDITED_EVENT_FRAGMENT = 'Edited';
const LIFECYCLE_MILESTONES = [
  `${EVENT_PREFIX}.NotificationCreated`,
  `${EVENT_PREFIX}.NotificationSubmitted`,
  `${EVENT_PREFIX}.NotificationAmendmentRequested`,
];

const milestonesOf = (eventTypes: string[]): string[] => eventTypes.filter((eventType) => !eventType.includes(EDITED_EVENT_FRAGMENT));

const eventTypesOn = async (outboxEvents: AdminOutboxEventsPage): Promise<string[]> =>
  (await outboxEvents.eventTypeCells.allTextContents()).map((eventType) => eventType.trim());

test.describe('Outbox event replay', { tag: ['@compose', '@integration'] }, () => {
  test.beforeEach(async ({ seededJourney }) => {
    await seededJourney.createAmendNotification();
  });

  test('replays outbox events and shows success banner', async ({ adminNavigation, pages, journeyContext }) => {
    await adminNavigation.toOutboxEvents(journeyContext.referenceNumber);

    await test.step('lists the notification lifecycle before replay', async () => {
      await expect
        .poll(async () => milestonesOf(await eventTypesOn(pages.adminOutboxEvents)), { timeout: timeouts.short })
        .toEqual(LIFECYCLE_MILESTONES);
    });

    const eventCountBeforeReplay = await pages.adminOutboxEvents.tableRows.count();

    await test.step('replays all events and shows success banner', async () => {
      await pages.adminOutboxEvents.btnReplay.click();
      await expect(pages.adminOutboxEvents.bannerSuccess).toBeVisible();
      await expect(pages.adminOutboxEvents.bannerSuccess).toContainText('All outbox events have been re-published to the SNS topic.');
    });

    await test.step('keeps every event it replayed', async () => {
      await expect(pages.adminOutboxEvents.tableRows).toHaveCount(eventCountBeforeReplay);
    });
  });

  test(
    'writes a REPLAY_EVENTS audit record covering every replayed event',
    { tag: '@mongodb' },
    async ({ adminNavigation, pages, journeyContext }) => {
      const { referenceNumber } = journeyContext;

      await adminNavigation.toOutboxEvents(referenceNumber);
      await expect.poll(() => pages.adminOutboxEvents.tableRows.count(), { timeout: timeouts.short }).toBeGreaterThan(0);
      const replayedEventCount = await pages.adminOutboxEvents.tableRows.count();

      await pages.adminOutboxEvents.btnReplay.click();
      await expect(pages.adminOutboxEvents.bannerSuccess).toBeVisible();

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

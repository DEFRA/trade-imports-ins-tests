import { test, expect } from '@fixtures';
import type { AnimalsAdminPages, SharedPages } from '@page-objects';
import { SqsClient } from '@adapters/queue/sqs-client';
import { seedDlqMessage } from '@flows/animals-admin/seed-dlq-message';
import { timeouts } from '@config/timeouts';

async function reloadUntilSeededRowListed(pages: SharedPages, animalsAdminPages: AnimalsAdminPages, eventId: string): Promise<void> {
  await expect(async () => {
    await pages.page.reload();
    await expect(animalsAdminPages.dlqEvents.rowContainingMessageId(eventId)).toBeVisible({ timeout: timeouts.short });
  }).toPass({ timeout: timeouts.medium });
}

test.describe('DLQ operator actions', { tag: '@compose' }, () => {
  // Serial: both tests act on the whole DLQ (replay-all / delete-all), so they must not run
  // concurrently against the one shared queue.
  test.describe.configure({ mode: 'serial' });

  let sqs: SqsClient;

  test.beforeAll(() => {
    sqs = new SqsClient();
  });

  test.afterAll(() => {
    sqs.destroy();
  });

  test('starts a replay of all DLQ messages from the admin UI', async ({ animalsAdminNavigation, pages, animalsAdminPages }) => {
    const eventId = await seedDlqMessage(sqs);

    await animalsAdminNavigation.toDlqEvents();
    await reloadUntilSeededRowListed(pages, animalsAdminPages, eventId);

    await animalsAdminPages.dlqEvents.btnReplayAll.click();

    // The success banner renders only after the real gateway replay-all call (with the real admin
    // secret) succeeded — the cross-service wiring this test exists to prove.
    await expect(animalsAdminPages.dlqEvents.successBanner).toContainText('Replay-all started');
  });

  test('starts a delete of all DLQ messages from the admin UI', async ({ animalsAdminNavigation, pages, animalsAdminPages }) => {
    const eventId = await seedDlqMessage(sqs);

    await animalsAdminNavigation.toDlqEvents();
    await reloadUntilSeededRowListed(pages, animalsAdminPages, eventId);

    await animalsAdminPages.dlqEvents.btnDeleteAll.click();
    await expect(animalsAdminPages.dlqEvents.deleteAllDialog).toBeVisible();
    await animalsAdminPages.dlqEvents.btnConfirmDeleteAll.click();

    // As above: the banner is proof the real gateway delete-all call succeeded.
    await expect(animalsAdminPages.dlqEvents.successBanner).toContainText('Delete-all started');
  });
});

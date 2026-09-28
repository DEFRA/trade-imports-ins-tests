import { test, expect } from '@fixtures';
import { SqsClient } from '@adapters/queue/sqs-client';
import { seedDlqMessage } from '@domain/fixtures/dlq-event';
import { timeouts } from '@config/timeouts';

test.describe('Security scan (admin, operator actions)', { tag: '@active' }, () => {
  test.describe.configure({ mode: 'serial' });

  let sqs: SqsClient;

  test.beforeAll(() => {
    sqs = new SqsClient();
  });

  test.afterAll(() => {
    sqs.destroy();
  });

  test('routes the admin write actions through the ZAP proxy', async ({
    animalsSeededJourney,
    animalsAdminNavigation,
    pages,
    animalsAdminPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createAmendNotification();

    await animalsAdminNavigation.toOutboxEvents(referenceNumber);
    await expect.poll(() => animalsAdminPages.outboxEvents.tableRows.count(), { timeout: timeouts.short }).toBeGreaterThan(0);
    await animalsAdminPages.outboxEvents.btnReplay.click();
    await expect(animalsAdminPages.outboxEvents.bannerSuccess).toBeVisible();

    await animalsAdminPages.notifications.open();
    await animalsAdminPages.notifications.inputReferenceNumber.fill(referenceNumber);
    await animalsAdminPages.notifications.deleteByReferenceNumber();
    await animalsAdminPages.notifications.btnConfirm.click();
    await expect(animalsAdminPages.notifications.alertSuccess).toBeVisible();

    const eventId = await seedDlqMessage(sqs);
    await animalsAdminNavigation.toDlqEvents();
    const seededDlqRow = animalsAdminPages.dlqEvents.rowById(eventId);
    await expect(async () => {
      if (!(await seededDlqRow.isVisible())) {
        await pages.page.reload();
      }
      await expect(seededDlqRow).toBeVisible({ timeout: timeouts.short });
    }).toPass({ timeout: timeouts.medium });

    await animalsAdminPages.dlqEvents.btnDeleteAll.click();
    await animalsAdminPages.dlqEvents.btnConfirmDeleteAll.click();
    await expect(animalsAdminPages.dlqEvents.bannerSuccess).toBeVisible();

    // No assertion: this goto exists only to put the static /about page through the ZAP proxy.
    await pages.page.goto('/about');
  });
});

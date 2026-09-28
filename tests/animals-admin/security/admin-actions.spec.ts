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

  test('routes the admin write actions through the ZAP proxy', async ({ seededJourney, adminNavigation, pages }) => {
    test.slow();
    const referenceNumber = await seededJourney.createAmendNotification();

    await adminNavigation.toOutboxEvents(referenceNumber);
    await expect.poll(() => pages.adminOutboxEvents.tableRows.count(), { timeout: timeouts.short }).toBeGreaterThan(0);
    await pages.adminOutboxEvents.btnReplay.click();
    await expect(pages.adminOutboxEvents.bannerSuccess).toBeVisible();

    await pages.adminNotifications.open();
    await pages.adminNotifications.inputReferenceNumber.fill(referenceNumber);
    await pages.adminNotifications.deleteByReferenceNumber();
    await pages.adminNotifications.btnConfirm.click();
    await expect(pages.adminNotifications.alertSuccess).toBeVisible();

    const eventId = await seedDlqMessage(sqs);
    await adminNavigation.toDlqEvents();
    const seededDlqRow = pages.adminDlqEvents.rowById(eventId);
    await expect(async () => {
      if (!(await seededDlqRow.isVisible())) {
        await pages.page.reload();
      }
      await expect(seededDlqRow).toBeVisible({ timeout: timeouts.short });
    }).toPass({ timeout: timeouts.medium });

    await pages.adminDlqEvents.btnDeleteAll.click();
    await pages.adminDlqEvents.btnConfirmDeleteAll.click();
    await expect(pages.adminDlqEvents.bannerSuccess).toBeVisible();

    // No assertion: this goto exists only to put the static /about page through the ZAP proxy.
    await pages.page.goto('/about');
  });
});

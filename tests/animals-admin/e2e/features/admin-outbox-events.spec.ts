import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';

/**
 * Integration seam: the admin operator UI over real data — the outbox events an operator inspects.
 *
 * A real UI submission emits the NotificationSubmitted outbox event (see outbox-event-notification.spec.ts);
 * this asserts the operator can find and inspect it on the admin Outbox events page. The write lags the
 * submit, so the search is re-issued until the row appears.
 */
test.describe('Outbox events (admin)', { tag: ['@integration', '@mongodb'] }, () => {
  test(
    'shows the outbox event for a submitted notification',
    { tag: '@smoke' },
    async ({ seededJourney, adminNavigation, animalsAdminPages }) => {
      test.slow();
      const referenceNumber = await seededJourney.createSubmittedNotification();

      await adminNavigation.toOutboxEvents(referenceNumber);
      const submittedRow = animalsAdminPages.outboxEvents.tableRows.filter({ hasText: 'NotificationSubmitted' });

      await expect
        .poll(
          async () => {
            await animalsAdminPages.outboxEvents.inputReferenceNumber.fill(referenceNumber);
            await animalsAdminPages.outboxEvents.btnSearch.click();
            return submittedRow.count();
          },
          { timeout: timeouts.long },
        )
        .toBe(1);

      await expect(submittedRow.locator('td').nth(1)).toContainText('NotificationSubmitted');
      await expect(submittedRow.locator('td').nth(2)).not.toBeEmpty();

      await submittedRow.getByRole('group').getByText('View JSON').click();
      const json = await submittedRow.locator('pre').textContent();
      expect(json).toContain(referenceNumber);
      expect(json).toContain('SUBMITTED');
    },
  );

  test('shows the empty state for an unknown reference number', async ({ adminNavigation, animalsAdminPages }) => {
    const unknownRef = 'GBN-AG-00-000000';
    await adminNavigation.toOutboxEvents(unknownRef);
    await expect(animalsAdminPages.outboxEvents.emptyStateMessage).toBeVisible();
    await expect(animalsAdminPages.outboxEvents.emptyStateMessage).toContainText(unknownRef);
  });
});

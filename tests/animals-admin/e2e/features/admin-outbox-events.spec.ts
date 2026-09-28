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
  test('shows the outbox event for a submitted notification', { tag: '@smoke' }, async ({ seededJourney, adminNavigation, pages }) => {
    test.slow();
    const referenceNumber = await seededJourney.createSubmittedNotification();

    await adminNavigation.toOutboxEvents(referenceNumber);
    const submittedRow = pages.adminOutboxEvents.tableRows.filter({ hasText: 'NotificationSubmitted' });

    await expect
      .poll(
        async () => {
          await pages.adminOutboxEvents.inputReferenceNumber.fill(referenceNumber);
          await pages.adminOutboxEvents.btnSearch.click();
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
  });

  test('shows the empty state for an unknown reference number', async ({ adminNavigation, pages }) => {
    const unknownRef = 'GBN-AG-00-000000';
    await adminNavigation.toOutboxEvents(unknownRef);
    await expect(pages.adminOutboxEvents.emptyStateMessage).toBeVisible();
    await expect(pages.adminOutboxEvents.emptyStateMessage).toContainText(unknownRef);
  });
});

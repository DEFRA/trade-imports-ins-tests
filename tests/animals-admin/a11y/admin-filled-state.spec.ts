import { test, WCAG_STANDARD } from '@fixtures/a11y';

const REFERENCE_NUMBER_WITH_NO_EVENTS = 'GBN-AG-00-000000';

test.describe(`Accessibility (admin) ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('each admin page has no accessibility violations after user input', async ({
    seededJourney,
    journeyContext,
    adminNavigation,
    pages,
    runA11yScan,
  }) => {
    await seededJourney.createSubmittedNotification();
    const { referenceNumber } = journeyContext;

    await test.step('Admin notifications', async () => {
      await adminNavigation.toNotifications();
      await pages.adminNotifications.inputReferenceNumber.fill(referenceNumber);
      await pages.adminNotifications.checkBoxSelectAll.check();
      await runA11yScan();
    });

    await test.step('Admin notifications delete confirmation', async () => {
      await pages.adminNotifications.checkBoxSelectAll.uncheck();
      await pages.adminNotifications.deleteByReferenceNumber();
      await runA11yScan();
    });

    // Outbox-events search results and replay are not scanned: that page's DLQ status check 502s while the DLQ is unstable.

    await test.step('Admin outbox events with no results', async () => {
      await adminNavigation.toOutboxEvents(REFERENCE_NUMBER_WITH_NO_EVENTS);
      await pages.adminOutboxEvents.emptyStateMessage.waitFor();
      await runA11yScan();
    });
  });
});

import { test, WCAG_STANDARD } from '@fixtures/a11y';

const REFERENCE_NUMBER_WITH_NO_EVENTS = 'GBN-AG-00-000000';

test.describe(`Accessibility (admin) ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('each admin page has no accessibility violations after user input', async ({
    animalsSeededJourney,
    journeyContext,
    animalsAdminNavigation,
    animalsAdminPages,
    runA11yScan,
  }) => {
    await animalsSeededJourney.createSubmittedNotification();
    const { referenceNumber } = journeyContext;

    await test.step('Admin notifications', async () => {
      await animalsAdminNavigation.toNotifications();
      await animalsAdminPages.notifications.inputReferenceNumber.fill(referenceNumber);
      await animalsAdminPages.notifications.checkBoxSelectAll.check();
      await runA11yScan();
    });

    await test.step('Admin notifications delete confirmation', async () => {
      await animalsAdminPages.notifications.checkBoxSelectAll.uncheck();
      await animalsAdminPages.notifications.deleteByReferenceNumber();
      await runA11yScan();
    });

    // Outbox-events search results and replay are not scanned: that page's DLQ status check 502s while the DLQ is unstable.

    await test.step('Admin outbox events with no results', async () => {
      await animalsAdminNavigation.toOutboxEvents(REFERENCE_NUMBER_WITH_NO_EVENTS);
      await animalsAdminPages.outboxEvents.emptyStateMessage.waitFor();
      await runA11yScan();
    });
  });
});

import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility (admin) ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('each admin page has no accessibility violations on initial load', async ({
    animalsAdminNavigation,
    animalsAdminPages,
    runA11yScan,
  }) => {
    await test.step('Admin dashboard', async () => {
      await animalsAdminNavigation.toAdminDashboard();
      await animalsAdminPages.dashboard.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Admin notifications', async () => {
      await animalsAdminPages.dashboard.btnNotifications.click();
      await animalsAdminPages.notifications.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Admin outbox events', async () => {
      await animalsAdminNavigation.toOutboxEvents();
      await animalsAdminPages.outboxEvents.heading.waitFor();
      await runA11yScan();
    });

    // DLQ page still in progress.
    // await test.step('Admin DLQ events', async () => {
    //   await animalsAdminNavigation.toDlqEvents();
    //   await animalsAdminPages.dlqEvents.heading.waitFor();
    //   await runA11yScan();
    // });
  });
});

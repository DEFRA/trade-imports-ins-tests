import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility (admin) ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('each admin page has no accessibility violations on initial load', async ({ adminNavigation, pages, runA11yScan }) => {
    await test.step('Admin dashboard', async () => {
      await adminNavigation.toAdminDashboard();
      await pages.adminDashboard.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Admin notifications', async () => {
      await pages.adminDashboard.btnNotifications.click();
      await pages.adminNotifications.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Admin outbox events', async () => {
      await adminNavigation.toOutboxEvents();
      await pages.adminOutboxEvents.heading.waitFor();
      await runA11yScan();
    });

    // DLQ page still in progress.
    // await test.step('Admin DLQ events', async () => {
    //   await adminNavigation.toDlqEvents();
    //   await pages.adminDlqEvents.heading.waitFor();
    //   await runA11yScan();
    // });
  });
});

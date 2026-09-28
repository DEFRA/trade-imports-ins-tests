import { test, WCAG_STANDARD, scanViewports, waitForViewportSettle } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  test('the notification dashboard has no accessibility violations across viewports', async ({ page, runA11yScan }) => {
    await test.step('Notification dashboard (default viewport)', async () => {
      await runA11yScan();
    });

    await test.step('Notification dashboard (narrow portrait)', async () => {
      await page.setViewportSize(scanViewports.narrowPortrait);
      await waitForViewportSettle(page);
      await runA11yScan();
    });

    await test.step('Notification dashboard (narrow landscape)', async () => {
      await page.setViewportSize(scanViewports.narrowLandscape);
      await waitForViewportSettle(page);
      await runA11yScan();
    });
  });
});

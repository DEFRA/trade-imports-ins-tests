import { test, WCAG_STANDARD, scanViewports, waitForViewportSettle } from '@fixtures/a11y';

test.describe(`Accessibility (admin) ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ adminNavigation, pages }) => {
    await adminNavigation.toAdminDashboard();
    await pages.adminDashboard.heading.waitFor();
  });

  test('the admin dashboard has no accessibility violations across viewports', async ({ page, runA11yScan }) => {
    await test.step('Admin dashboard (default viewport)', async () => {
      await runA11yScan();
    });

    await test.step('Admin dashboard (narrow portrait)', async () => {
      await page.setViewportSize(scanViewports.narrowPortrait);
      await waitForViewportSettle(page);
      await runA11yScan();
    });

    await test.step('Admin dashboard (narrow landscape)', async () => {
      await page.setViewportSize(scanViewports.narrowLandscape);
      await waitForViewportSettle(page);
      await runA11yScan();
    });
  });
});

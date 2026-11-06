import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';
import { dashboardSortValues } from '@domain/ins/constants/dashboard-sort-values';
import { timeouts } from '@config/timeouts';
import { scanNextPage } from '@utils/next-page-scan';

const noMatchReferenceNumber = 'GBN-AG-26-ZZZZZZ';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ insPages }) => {
    await insPages.dashboard.open();
  });

  test('the dashboard has no accessibility violations in its default and sorted views, and the not found page has none', async ({
    pages,
    insPages,
    runA11yScan,
  }) => {
    await test.step('Dashboard (populated list)', async () => {
      await expect(insPages.dashboard.dropdownSort).toBeVisible();
      await runA11yScan();
    });

    await test.step('Dashboard (sorted)', async () => {
      await insPages.dashboard.sortBy(dashboardSortValues.updatedOldestFirst);
      await insPages.dashboard.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Page not found', async () => {
      await pages.page.goto('/no-such-page');
      await pages.page.getByRole('heading', { name: '404' }).waitFor();
      await runA11yScan();
    });
  });

  test('the dashboard has no accessibility violations when searched', async ({ insPages, runA11yScan, animalsSeededJourney }) => {
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();

    await test.step('Dashboard (search match)', async () => {
      await expect
        .poll(
          async () => {
            await insPages.dashboard.searchForReference(referenceNumber);
            return insPages.dashboard.row(referenceNumber).count();
          },
          { timeout: timeouts.long },
        )
        .toBeGreaterThan(0);
      await runA11yScan();
    });

    await test.step('Dashboard (search no-match)', async () => {
      await insPages.dashboard.searchForReference(noMatchReferenceNumber);
      await insPages.dashboard.noSearchResults.waitFor();
      await runA11yScan();
    });
  });

  test('the dashboard has no accessibility violations when paginated', async ({ insPages, runA11yScan, animalsSeededJourney }) => {
    test.slow();
    const notificationsFillingTwoPages = 26;
    await Promise.all(Array.from({ length: notificationsFillingTwoPages }, () => animalsSeededJourney.createEmptyNotification()));
    await expect
      .poll(
        async () => {
          await insPages.dashboard.open();
          return insPages.dashboard.nextPageLink.isVisible();
        },
        { timeout: timeouts.long },
      )
      .toBe(true);

    await scanNextPage(insPages.dashboard.nextPageLink, runA11yScan);
  });
});

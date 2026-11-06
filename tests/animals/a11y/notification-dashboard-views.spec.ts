import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';
import { sortByValues } from '@domain/animals/constants/sort-by-values';
import { SET_BASES } from '@page-objects/shared/sets';
import { scanNextPage } from '@utils/next-page-scan';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toNotificationDashboard();
  });

  test('the notification dashboard has no accessibility violations in its default and sorted views, and the not found page has none', async ({
    pages,
    animalsPages,
    runA11yScan,
  }) => {
    await test.step('Notification dashboard (populated list)', async () => {
      await runA11yScan();
    });

    await test.step('Notification dashboard (sorted)', async () => {
      await animalsPages.dashboard.sortBy(sortByValues.dateCreatedNewestToOldest);
      await animalsPages.dashboard.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Page not found', async () => {
      await pages.page.goto(`${SET_BASES.liveAnimals}/no-such-page`);
      await pages.page.getByRole('heading', { name: '404' }).waitFor();
      await runA11yScan();
    });
  });

  test('the notification dashboard has no accessibility violations when searched', async ({
    animalsPages,
    runA11yScan,
    animalsSeededJourney,
    animalsJourney,
  }) => {
    const noMatchReferenceNumber = 'GBN-AG-26-ZZZZZZ';

    await test.step('Notification dashboard (search match)', async () => {
      const referenceNumber = await animalsSeededJourney.createSubmittedNotification();
      await animalsJourney.toNotificationDashboard();
      await animalsPages.dashboard.searchForReference(referenceNumber);
      await animalsPages.dashboard.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Notification dashboard (search no-match)', async () => {
      await animalsPages.dashboard.searchForReference(noMatchReferenceNumber);
      await animalsPages.dashboard.resultsLabel.waitFor();
      await runA11yScan();
    });
  });

  test('the notification dashboard has no accessibility violations when paginated', async ({
    animalsPages,
    runA11yScan,
    animalsSeededJourney,
    animalsJourney,
  }) => {
    test.slow();
    const notificationsFillingTwoPages = 26;
    await Promise.all(Array.from({ length: notificationsFillingTwoPages }, () => animalsSeededJourney.createEmptyNotification()));
    await animalsJourney.toNotificationDashboard();
    await expect(animalsPages.dashboard.nextPageLink).toBeVisible();

    await scanNextPage(animalsPages.dashboard.nextPageLink, runA11yScan);
  });
});

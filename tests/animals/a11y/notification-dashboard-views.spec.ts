import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { sortByValues } from '@domain/constants/sort-by-values';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  test('the notification dashboard has no accessibility violations in its default and sorted views', async ({ pages, runA11yScan }) => {
    await test.step('Notification dashboard (populated list)', async () => {
      await runA11yScan();
    });

    await test.step('Notification dashboard (sorted)', async () => {
      await pages.notificationDashboard.sortBy(sortByValues.dateCreatedNewestToOldest);
      await pages.notificationDashboard.heading.waitFor();
      await runA11yScan();
    });
  });

  test('the notification dashboard has no accessibility violations when searched', async ({
    pages,
    runA11yScan,
    seededJourney,
    journey,
  }) => {
    const noMatchReferenceNumber = 'GBN-AG-26-ZZZZZZ';

    await test.step('Notification dashboard (search match)', async () => {
      const referenceNumber = await seededJourney.createSubmittedNotification();
      await journey.toNotificationDashboard();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await pages.notificationDashboard.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Notification dashboard (search no-match)', async () => {
      await pages.notificationDashboard.searchForReference(noMatchReferenceNumber);
      await pages.notificationDashboard.resultsLabel.waitFor();
      await runA11yScan();
    });
  });

  test.describe('pagination', () => {
    test.beforeEach(async ({ pages }) => {
      const hasPagination = await pages.notificationDashboard.pagination.isVisible();
      test.skip(
        !hasPagination,
        'Requires more than one page of notifications (seeded in compose; CDP environments normally have sufficient data).',
      );
    });

    test('the notification dashboard has no accessibility violations when paginated', async ({ pages, runA11yScan }) => {
      await pages.notificationDashboard.linkNextPage.click();
      await pages.notificationDashboard.heading.waitFor();
      await runA11yScan();
    });
  });
});

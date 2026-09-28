import { SET_BASES } from '@page-objects/shared/sets';

import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/constants/sort-by-values';

const NO_MATCH_REFERENCE_NUMBER = 'GBN-AG-26-ZZZZZZ';

const escapeHyphens = (reference: string) => reference.replace(/-/g, '\\-');

const wholeReferenceNumberParamPattern = (reference: string) => new RegExp(`[?&]referenceNumber=${escapeHyphens(reference)}(?:&|$)`);

const referenceNumberAnywhereInUrlPattern = (reference: string) => new RegExp(`referenceNumber=${escapeHyphens(reference)}`);

test.describe('Notification dashboard search', () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toNotificationDashboard();
  });

  test('displays the filter notifications search form', async ({ animalsPages }) => {
    await expect(animalsPages.dashboard.filterHeading).toBeVisible();
    await expect(animalsPages.dashboard.searchForm).toBeVisible();
    await expect(animalsPages.dashboard.inputReferenceSearch).toBeVisible();
    await expect(animalsPages.dashboard.btnSearch).toBeVisible();
  });

  test('returns matching notification when searching by complete reference number', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
    animalsJourney,
  }) => {
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();
    await animalsJourney.toNotificationDashboard();

    await animalsPages.dashboard.searchForReference(referenceNumber);

    await expect(pages.page).toHaveURL(wholeReferenceNumberParamPattern(referenceNumber));
    await expect(animalsPages.dashboard.notificationCards).toHaveCount(1);
    await expect(animalsPages.dashboard.notificationCardDetails(0).heading).toContainText(referenceNumber);
    await expect(animalsPages.dashboard.resultsLabel).toHaveText('Showing 1 Result');
  });

  test('opens notification view when clicking View after searching by reference number', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
    animalsJourney,
  }) => {
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();
    await animalsJourney.toNotificationDashboard();

    await animalsPages.dashboard.searchForReference(referenceNumber);
    await expect(animalsPages.dashboard.notificationCards).toHaveCount(1);

    await animalsPages.dashboard.viewLink(referenceNumber).click();

    await expect(pages.page).toHaveURL(new RegExp(animalsPages.notificationView.expectedUrl(referenceNumber)));
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.referenceNumberCaption).toContainText(referenceNumber);
  });

  test('shows no notifications found when search has no matches', async ({ pages, animalsPages }) => {
    await animalsPages.dashboard.searchForReference(NO_MATCH_REFERENCE_NUMBER);

    await expect(pages.page).toHaveURL(wholeReferenceNumberParamPattern(NO_MATCH_REFERENCE_NUMBER));
    await expect(animalsPages.dashboard.notificationCards).toHaveCount(0);
    await expect(animalsPages.dashboard.resultsLabel).toHaveText('No notifications found');
  });

  test('shows no notifications found when search text is free text', async ({ pages, animalsPages }) => {
    await animalsPages.dashboard.searchForReference('not-a-valid-reference');

    await expect(pages.page).toHaveURL(/referenceNumber=not-a-valid-reference/);
    await expect(animalsPages.dashboard.notificationCards).toHaveCount(0);
    await expect(animalsPages.dashboard.resultsLabel).toHaveText('No notifications found');
    await expect(animalsPages.dashboard.errorSummary).not.toBeVisible();
  });

  test('preserves referenceNumber when updating sort after search', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
    animalsJourney,
  }) => {
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();
    await animalsJourney.toNotificationDashboard();

    await animalsPages.dashboard.searchForReference(referenceNumber);
    await animalsPages.dashboard.sortBy(sortByValues.dateCreatedNewestToOldest);

    await expect(pages.page).toHaveURL(referenceNumberAnywhereInUrlPattern(referenceNumber));
    await expect(pages.page).toHaveURL(/sort=createdAt%2Cdesc/);
    await expect(animalsPages.dashboard.inputReferenceSearch).toHaveValue(referenceNumber);
  });

  test('preserves referenceNumber in the URL when a page param is present', async ({ pages, animalsPages }) => {
    await animalsPages.dashboard.searchForReference(NO_MATCH_REFERENCE_NUMBER);

    // Straight to the set's dashboard: `/` redirects to it but drops the query
    // string on the way, which is the very thing this test is asserting survives.
    await pages.page.goto(`${SET_BASES.liveAnimals}?referenceNumber=${NO_MATCH_REFERENCE_NUMBER}&page=2`);
    await animalsPages.dashboard.heading.waitFor();
    await animalsPages.dashboard.waitForNotificationList();

    await expect(pages.page).toHaveURL(referenceNumberAnywhereInUrlPattern(NO_MATCH_REFERENCE_NUMBER));
    await expect(animalsPages.dashboard.inputReferenceSearch).toHaveValue(NO_MATCH_REFERENCE_NUMBER);
  });
});

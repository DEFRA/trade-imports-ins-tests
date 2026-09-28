import { SET_BASES } from '@page-objects/base/sets';

import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/constants/sort-by-values';

const NO_MATCH_REFERENCE_NUMBER = 'GBN-AG-26-ZZZZZZ';

const escapeHyphens = (reference: string) => reference.replace(/-/g, '\\-');

const wholeReferenceNumberParamPattern = (reference: string) => new RegExp(`[?&]referenceNumber=${escapeHyphens(reference)}(?:&|$)`);

const referenceNumberAnywhereInUrlPattern = (reference: string) => new RegExp(`referenceNumber=${escapeHyphens(reference)}`);

test.describe('Notification dashboard search', () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  test('displays the filter notifications search form', async ({ pages }) => {
    await expect(pages.notificationDashboard.filterHeading).toBeVisible();
    await expect(pages.notificationDashboard.searchForm).toBeVisible();
    await expect(pages.notificationDashboard.inputReferenceSearch).toBeVisible();
    await expect(pages.notificationDashboard.btnSearch).toBeVisible();
  });

  test('returns matching notification when searching by complete reference number', async ({ pages, seededJourney, journey }) => {
    const referenceNumber = await seededJourney.createSubmittedNotification();
    await journey.toNotificationDashboard();

    await pages.notificationDashboard.searchForReference(referenceNumber);

    await expect(pages.page).toHaveURL(wholeReferenceNumberParamPattern(referenceNumber));
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(1);
    await expect(pages.notificationDashboard.notificationCardDetails(0).heading).toContainText(referenceNumber);
    await expect(pages.notificationDashboard.resultsLabel).toHaveText('Showing 1 Result');
  });

  test('opens notification view when clicking View after searching by reference number', async ({ pages, seededJourney, journey }) => {
    const referenceNumber = await seededJourney.createSubmittedNotification();
    await journey.toNotificationDashboard();

    await pages.notificationDashboard.searchForReference(referenceNumber);
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(1);

    await pages.notificationDashboard.viewLink(referenceNumber).click();

    await expect(pages.page).toHaveURL(new RegExp(pages.notificationView.expectedUrl(referenceNumber)));
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.referenceNumberCaption).toContainText(referenceNumber);
  });

  test('shows no notifications found when search has no matches', async ({ pages }) => {
    await pages.notificationDashboard.searchForReference(NO_MATCH_REFERENCE_NUMBER);

    await expect(pages.page).toHaveURL(wholeReferenceNumberParamPattern(NO_MATCH_REFERENCE_NUMBER));
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    await expect(pages.notificationDashboard.resultsLabel).toHaveText('No notifications found');
  });

  test('shows no notifications found when search text is free text', async ({ pages }) => {
    await pages.notificationDashboard.searchForReference('not-a-valid-reference');

    await expect(pages.page).toHaveURL(/referenceNumber=not-a-valid-reference/);
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    await expect(pages.notificationDashboard.resultsLabel).toHaveText('No notifications found');
    await expect(pages.notificationDashboard.errorSummary).not.toBeVisible();
  });

  test('preserves referenceNumber when updating sort after search', async ({ pages, seededJourney, journey }) => {
    const referenceNumber = await seededJourney.createSubmittedNotification();
    await journey.toNotificationDashboard();

    await pages.notificationDashboard.searchForReference(referenceNumber);
    await pages.notificationDashboard.sortBy(sortByValues.dateCreatedNewestToOldest);

    await expect(pages.page).toHaveURL(referenceNumberAnywhereInUrlPattern(referenceNumber));
    await expect(pages.page).toHaveURL(/sort=createdAt%2Cdesc/);
    await expect(pages.notificationDashboard.inputReferenceSearch).toHaveValue(referenceNumber);
  });

  test('preserves referenceNumber in the URL when a page param is present', async ({ pages }) => {
    await pages.notificationDashboard.searchForReference(NO_MATCH_REFERENCE_NUMBER);

    // Straight to the set's dashboard: `/` redirects to it but drops the query
    // string on the way, which is the very thing this test is asserting survives.
    await pages.page.goto(`${SET_BASES.liveAnimals}?referenceNumber=${NO_MATCH_REFERENCE_NUMBER}&page=2`);
    await pages.notificationDashboard.heading.waitFor();
    await pages.notificationDashboard.waitForNotificationList();

    await expect(pages.page).toHaveURL(referenceNumberAnywhereInUrlPattern(NO_MATCH_REFERENCE_NUMBER));
    await expect(pages.notificationDashboard.inputReferenceSearch).toHaveValue(NO_MATCH_REFERENCE_NUMBER);
  });
});

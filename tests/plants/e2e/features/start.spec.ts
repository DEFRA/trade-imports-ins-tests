import { SET_BASES } from '@page-objects/shared/sets';
import { test, expect } from '@fixtures';

/**
 * The plants reference carries the agreed GBN-HRP type code: the backend's
 * ReferenceNumberGenerator mints GBN-HRP-{YY}-{XXXXXX} over a Crockford-style
 * alphabet, and the frontend's real records adapter carries it through as the
 * journey id. Assert the shape, never a literal — the body is random.
 */
const PLANTS_REFERENCE = /^GBN-HRP-\d{2}-[0-9A-HJ-KM-NP-TV-Z]{6}$/;

test.describe('High-risk plants start section', { tag: '@integration' }, () => {
  test('the dashboard renders after signing in', { tag: '@smoke' }, async ({ pages, plantsPages }) => {
    await plantsPages.dashboard.open();

    await expect(pages.page).toHaveURL(plantsPages.dashboard.expectedUrl);
    await expect(plantsPages.dashboard.heading).toBeVisible();
    await expect(plantsPages.dashboard.btnStartNewNotification).toBeVisible();
    await expect(plantsPages.dashboard.errorSummary).not.toBeVisible();
  });

  test('starting a notification opens the run on the commodity-type page', async ({
    pages,
    plantsPages,
    plantsJourney,
    journeyContext,
  }) => {
    const reference = await plantsJourney.startNotification();

    expect(reference).toMatch(PLANTS_REFERENCE);
    expect(journeyContext.referenceNumber).toBe(reference);
    await expect(pages.page).toHaveURL(plantsPages.commodityType.expectedUrl(reference));
    await expect(plantsPages.commodityType.heading).toBeVisible();
    await expect(plantsPages.commodityType.commodityType('Potatoes (seed or ware)')).toBeVisible();

    // The entry page's back link is the one in the journey that depends on
    // state: nothing is committed yet, so it points at the dashboard.
    await expect(plantsPages.commodityType.linkBack).toHaveAttribute('href', plantsPages.dashboard.expectedUrl);
  });

  test('the Overview carries the journey strip and the task rows landed so far', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverview();

    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
    await expect(plantsPages.overview.heading).toBeVisible();

    await expect(plantsPages.overview.journeyStrip).toBeVisible();
    await expect(plantsPages.overview.statusTag).toHaveText('Draft');
    await expect(plantsPages.overview.reference).toHaveText(reference);

    // All four groups have landed a row, and a group with no rows is not
    // rendered — each section's own spec asserts its row as that page lands.
    await expect(plantsPages.overview.taskLists).toHaveCount(4);
    await expect(plantsPages.overview.groupHeadings).toHaveText([
      '1. About the consignment',
      '2. Arrival and destination',
      '3. Consignment parties',
      '4. Check and submit',
    ]);
    await expect(plantsPages.overview.taskRowLink('What are you importing?')).toHaveAttribute(
      'href',
      `${SET_BASES.highRiskPlants}/notifications/${reference}/commodity-type`,
    );
    await expect(plantsPages.overview.taskRow('What are you importing?')).toContainText('Not yet started');

    // Arrival holds only the arrival-status question so far, and that question
    // is out of scope until a commodity type that is asked it is chosen — so on
    // a notification with nothing answered the row is blocked and has no link.
    await expect(plantsPages.overview.taskRowByTitle('Arrival details')).toContainText('Cannot start yet');
    await expect(plantsPages.overview.taskRowLink('Arrival details')).toHaveCount(0);

    // Consignment parties renders because identification numbers is an
    // unconditional row. That row's own questions are out of scope until a
    // commodity type is chosen, so it is blocked and carries no link; the
    // consignor row is conditional and is hidden entirely while it is NA.
    await expect(plantsPages.overview.taskRowByTitle('Identification numbers')).toContainText('Cannot start yet');
    await expect(plantsPages.overview.taskRowLink('Identification numbers')).toHaveCount(0);
    await expect(plantsPages.overview.taskRowByTitle('Consignor or exporter')).toHaveCount(0);

    // Check and submit is blocked until every other row is complete, so on a
    // notification with nothing answered it is blocked and carries no link.
    await expect(plantsPages.overview.taskRowByTitle('Check and submit')).toContainText('Cannot start yet');
    await expect(plantsPages.overview.taskRowLink('Check and submit')).toHaveCount(0);

    await expect(plantsPages.overview.btnReturnToDashboard).toHaveAttribute('href', plantsPages.dashboard.expectedUrl);
    await expect(plantsPages.overview.linkBack).toHaveAttribute('href', plantsPages.dashboard.expectedUrl);
  });

  test('the new draft is listed on the dashboard and Resume reopens it', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverview();
    await plantsJourney.returnToDashboard();
    await plantsPages.dashboard.searchForReference(reference);

    await expect(plantsPages.dashboard.notificationCard(reference)).toBeVisible();
    await expect(plantsPages.dashboard.statusTag(reference)).toHaveText('Draft');

    await plantsPages.dashboard.resume(reference).click();

    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
    await expect(plantsPages.overview.heading).toBeVisible();
  });

  test('No, return to dashboard leaves the notification untouched', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverview();
    await plantsJourney.returnToDashboard();
    await plantsJourney.deleteFromDashboard(reference);

    await expect(pages.page).toHaveURL(plantsPages.deleteNotification.expectedUrl(reference));
    await expect(plantsPages.deleteNotification.heading).toBeVisible();
    await expect(plantsPages.deleteNotification.body).toBeVisible();
    await expect(plantsPages.deleteNotification.btnNo).toHaveAttribute('href', plantsPages.dashboard.expectedUrl);

    await plantsPages.deleteNotification.btnNo.click();

    await expect(plantsPages.dashboard.heading).toBeVisible();
    await expect(plantsPages.dashboard.deletedBanner).toHaveCount(0);

    await plantsPages.dashboard.searchForReference(reference);
    await expect(plantsPages.dashboard.notificationCard(reference)).toBeVisible();
    await expect(plantsPages.dashboard.statusTag(reference)).toHaveText('Draft');
  });

  test('Yes, delete notification soft-deletes it and drops it from the listing', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverview();
    await plantsJourney.returnToDashboard();
    await plantsJourney.deleteFromDashboard(reference);

    await plantsPages.deleteNotification.btnConfirm.click();

    await expect(pages.page).toHaveURL(`${plantsPages.dashboard.expectedUrl}?deleted=1`);
    await expect(plantsPages.dashboard.deletedBanner).toContainText('Notification deleted');
    await expect(plantsPages.dashboard.deletedBanner).toContainText('The notification has been deleted.');

    // DELETED rows are filtered out of the listing, so the reference now
    // matches nothing — proved against the search, not against page one.
    await plantsPages.dashboard.searchForReference(reference);
    await expect(plantsPages.dashboard.notificationCard(reference)).toHaveCount(0);
  });
});

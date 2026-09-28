import { SET_BASES } from '@page-objects/base/sets';
import { test, expect } from '@fixtures';

/**
 * The plants reference carries the agreed GBN-HRP type code: the backend's
 * ReferenceNumberGenerator mints GBN-HRP-{YY}-{XXXXXX} over a Crockford-style
 * alphabet, and the frontend's real records adapter carries it through as the
 * journey id. Assert the shape, never a literal — the body is random.
 */
const PLANTS_REFERENCE = /^GBN-HRP-\d{2}-[0-9A-HJ-KM-NP-TV-Z]{6}$/;

test.describe('High-risk plants start section', { tag: '@integration' }, () => {
  test('the dashboard renders after signing in', { tag: '@smoke' }, async ({ pages }) => {
    await pages.plantsDashboard.open();

    await expect(pages.page).toHaveURL(pages.plantsDashboard.expectedUrl);
    await expect(pages.plantsDashboard.heading).toBeVisible();
    await expect(pages.plantsDashboard.btnStartNewNotification).toBeVisible();
    await expect(pages.plantsDashboard.errorSummary).not.toBeVisible();
  });

  test('starting a notification opens the run on the commodity-type page', async ({ pages, plantsJourney, journeyContext }) => {
    const reference = await plantsJourney.startNotification();

    expect(reference).toMatch(PLANTS_REFERENCE);
    expect(journeyContext.referenceNumber).toBe(reference);
    await expect(pages.page).toHaveURL(pages.plantsCommodityType.expectedUrl(reference));
    await expect(pages.plantsCommodityType.heading).toBeVisible();
    await expect(pages.plantsCommodityType.commodityType('Potatoes (seed or ware)')).toBeVisible();

    // The entry page's back link is the one in the journey that depends on
    // state: nothing is committed yet, so it points at the dashboard.
    await expect(pages.plantsCommodityType.linkBack).toHaveAttribute('href', pages.plantsDashboard.expectedUrl);
  });

  test('the Overview carries the journey strip and the task rows landed so far', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverview();

    await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
    await expect(pages.plantsOverview.heading).toBeVisible();

    await expect(pages.plantsOverview.journeyStrip).toBeVisible();
    await expect(pages.plantsOverview.statusTag).toHaveText('Draft');
    await expect(pages.plantsOverview.reference).toHaveText(reference);

    // All four groups have landed a row, and a group with no rows is not
    // rendered — each section's own spec asserts its row as that page lands.
    await expect(pages.plantsOverview.taskLists).toHaveCount(4);
    await expect(pages.plantsOverview.groupHeadings).toHaveText([
      '1. About the consignment',
      '2. Arrival and destination',
      '3. Consignment parties',
      '4. Check and submit',
    ]);
    await expect(pages.plantsOverview.taskRowLink('What are you importing?')).toHaveAttribute(
      'href',
      `${SET_BASES.highRiskPlants}/notifications/${reference}/commodity-type`,
    );
    await expect(pages.plantsOverview.taskRow('What are you importing?')).toContainText('Not yet started');

    // Arrival holds only the arrival-status question so far, and that question
    // is out of scope until a commodity type that is asked it is chosen — so on
    // a notification with nothing answered the row is blocked and has no link.
    await expect(pages.plantsOverview.taskRowByTitle('Arrival details')).toContainText('Cannot start yet');
    await expect(pages.plantsOverview.taskRowLink('Arrival details')).toHaveCount(0);

    // Consignment parties renders because identification numbers is an
    // unconditional row. That row's own questions are out of scope until a
    // commodity type is chosen, so it is blocked and carries no link; the
    // consignor row is conditional and is hidden entirely while it is NA.
    await expect(pages.plantsOverview.taskRowByTitle('Identification numbers')).toContainText('Cannot start yet');
    await expect(pages.plantsOverview.taskRowLink('Identification numbers')).toHaveCount(0);
    await expect(pages.plantsOverview.taskRowByTitle('Consignor or exporter')).toHaveCount(0);

    // Check and submit is blocked until every other row is complete, so on a
    // notification with nothing answered it is blocked and carries no link.
    await expect(pages.plantsOverview.taskRowByTitle('Check and submit')).toContainText('Cannot start yet');
    await expect(pages.plantsOverview.taskRowLink('Check and submit')).toHaveCount(0);

    await expect(pages.plantsOverview.btnReturnToDashboard).toHaveAttribute('href', pages.plantsDashboard.expectedUrl);
    await expect(pages.plantsOverview.linkBack).toHaveAttribute('href', pages.plantsDashboard.expectedUrl);
  });

  test('the new draft is listed on the dashboard and Resume reopens it', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverview();
    await plantsJourney.returnToDashboard();
    await pages.plantsDashboard.searchForReference(reference);

    await expect(pages.plantsDashboard.notificationCard(reference)).toBeVisible();
    await expect(pages.plantsDashboard.statusTag(reference)).toHaveText('Draft');

    await pages.plantsDashboard.resume(reference).click();

    await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
    await expect(pages.plantsOverview.heading).toBeVisible();
  });

  test('No, return to dashboard leaves the notification untouched', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverview();
    await plantsJourney.returnToDashboard();
    await plantsJourney.deleteFromDashboard(reference);

    await expect(pages.page).toHaveURL(pages.plantsDeleteNotification.expectedUrl(reference));
    await expect(pages.plantsDeleteNotification.heading).toBeVisible();
    await expect(pages.plantsDeleteNotification.body).toBeVisible();
    await expect(pages.plantsDeleteNotification.btnNo).toHaveAttribute('href', pages.plantsDashboard.expectedUrl);

    await pages.plantsDeleteNotification.btnNo.click();

    await expect(pages.plantsDashboard.heading).toBeVisible();
    await expect(pages.plantsDashboard.deletedBanner).toHaveCount(0);

    await pages.plantsDashboard.searchForReference(reference);
    await expect(pages.plantsDashboard.notificationCard(reference)).toBeVisible();
    await expect(pages.plantsDashboard.statusTag(reference)).toHaveText('Draft');
  });

  test('Yes, delete notification soft-deletes it and drops it from the listing', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverview();
    await plantsJourney.returnToDashboard();
    await plantsJourney.deleteFromDashboard(reference);

    await pages.plantsDeleteNotification.btnConfirm.click();

    await expect(pages.page).toHaveURL(`${pages.plantsDashboard.expectedUrl}?deleted=1`);
    await expect(pages.plantsDashboard.deletedBanner).toContainText('Notification deleted');
    await expect(pages.plantsDashboard.deletedBanner).toContainText('The notification has been deleted.');

    // DELETED rows are filtered out of the listing, so the reference now
    // matches nothing — proved against the search, not against page one.
    await pages.plantsDashboard.searchForReference(reference);
    await expect(pages.plantsDashboard.notificationCard(reference)).toHaveCount(0);
  });
});

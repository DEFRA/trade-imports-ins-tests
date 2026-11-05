import { WHOLE_REFERENCE_NUMBER_PATTERN } from '@domain/plants/constants/reference-number-patterns';
import { SET_BASES } from '@page-objects/shared/sets';
import { test, expect } from '@fixtures';

test.describe('High-risk plants start section', () => {
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

    expect(reference).toMatch(WHOLE_REFERENCE_NUMBER_PATTERN);
    expect(journeyContext.referenceNumber).toBe(reference);
    await expect(pages.page).toHaveURL(plantsPages.commodityType.expectedUrl(reference));
    await expect(plantsPages.commodityType.heading).toBeVisible();
    await expect(plantsPages.commodityType.commodityType('Potatoes (seed or ware)')).toBeVisible();

    await expect(plantsPages.commodityType.linkBack).toHaveAttribute('href', plantsPages.dashboard.expectedUrl);
  });

  test('the Overview shows the journey strip, the Draft status, the four group captions and each task row state', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverview();

    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
    await expect(plantsPages.overview.heading).toBeVisible();

    await expect(plantsPages.overview.journeyStrip).toBeVisible();
    await expect(plantsPages.overview.statusTag).toHaveText('Draft');
    await expect(plantsPages.overview.notificationReference).toHaveText(reference);
    await expect(plantsPages.overview.cancelAmend).toHaveCount(0);

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

    await expect(plantsPages.overview.taskRowByTitle('Arrival details')).toContainText('Cannot start yet');
    await expect(plantsPages.overview.taskRowLink('Arrival details')).toHaveCount(0);

    await expect(plantsPages.overview.taskRowByTitle('Identification numbers')).toContainText('Cannot start yet');
    await expect(plantsPages.overview.taskRowLink('Identification numbers')).toHaveCount(0);
    await expect(plantsPages.overview.taskRowByTitle('Consignor')).toHaveCount(0);

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
    await expect(plantsPages.dashboard.cardStatusTag(reference)).toHaveText('Draft');

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
    await expect(plantsPages.dashboard.cardStatusTag(reference)).toHaveText('Draft');
  });

  test('Yes, delete notification shows the deleted banner and the reference no longer matches a dashboard search', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverview();
    await plantsJourney.returnToDashboard();
    await plantsJourney.deleteFromDashboard(reference);

    await plantsPages.deleteNotification.confirmDelete.click();

    await expect(pages.page).toHaveURL(`${plantsPages.dashboard.expectedUrl}?deleted=1`);
    await expect(plantsPages.dashboard.deletedBanner).toContainText('Notification deleted');
    await expect(plantsPages.dashboard.deletedBanner).toContainText('The notification has been deleted.');

    await plantsPages.dashboard.searchForReference(reference);
    await expect(plantsPages.dashboard.notificationCard(reference)).toHaveCount(0);
  });
});

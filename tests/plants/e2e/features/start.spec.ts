import type { PlantsPages } from '@page-objects';
import { WHOLE_REFERENCE_NUMBER_PATTERN } from '@domain/plants/constants/reference-number-patterns';
import { TRAIL_START } from '@page-objects/shared/base-page';
import { POTATOES } from '@flows/plants/journey';
import { test, expect } from '@fixtures';

const GROUP_CAPTIONS = ['1. About the consignment', '2. Arrival and destination', '3. Consignment parties', '4. Check and submit'];

test.describe('High-risk plants start section', () => {
  test('the dashboard renders after signing in', { tag: '@smoke' }, async ({ pages, plantsPages }) => {
    await plantsPages.dashboard.open();

    await expect(pages.page).toHaveURL(plantsPages.dashboard.expectedUrl);
    await expect(plantsPages.dashboard.heading).toBeVisible();
    await expect(plantsPages.dashboard.btnStartNewNotification).toBeVisible();
    await expect(plantsPages.dashboard.errorSummary).not.toBeVisible();
  });

  test('starting a notification opens the commodity-type page', async ({ pages, plantsPages, plantsJourney, journeyContext }) => {
    const reference = await plantsJourney.startNotification();

    expect(reference).toMatch(WHOLE_REFERENCE_NUMBER_PATTERN);
    expect(journeyContext.referenceNumber).toBe(reference);
    await expect(pages.page).toHaveURL(plantsPages.commodityType.expectedUrlPattern(reference));
    await expect(plantsPages.commodityType.heading).toBeVisible();
    await expect(plantsPages.commodityType.commodityType('Potatoes (seed or ware)')).toBeVisible();

    await expect(plantsPages.commodityType.linkBack).toHaveAttribute('href', plantsPages.dashboard.expectedUrl);
  });

  test("on a brand-new notification the first page's Cancel and return to overview opens the dashboard, and once the commodity type is saved it opens Overview", async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.startNotification();
    await plantsPages.commodityType.cancelAndReturnToOverview.click();
    await expect(pages.page).toHaveURL(plantsPages.dashboard.expectedUrl);

    await plantsPages.commodityType.open(reference);
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsPages.commodityType.open(reference);
    await plantsPages.commodityType.cancelAndReturnToOverview.click();
    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrlPattern(reference));
  });

  for (const [name, open] of [
    ['Overview', (pagesOf: PlantsPages, reference: string) => pagesOf.overview.open(reference)],
    ['the review page', (pagesOf: PlantsPages, reference: string) => pagesOf.notificationView.open(reference)],
    ['the declaration', (pagesOf: PlantsPages, reference: string) => pagesOf.declaration.open(reference)],
    ['the confirmation page', (pagesOf: PlantsPages, reference: string) => pagesOf.confirmation.open(reference)],
  ] as const) {
    test(`${name} of a notification with nothing saved shows the first page`, async ({ pages, plantsPages, plantsJourney }) => {
      const reference = await plantsJourney.startNotification();

      await open(plantsPages, reference);

      await expect(pages.page).toHaveURL(plantsPages.commodityType.expectedUrlPattern(reference));
      await expect(plantsPages.commodityType.heading).toBeVisible();
    });
  }

  test('the Overview shows the journey strip, the Draft status, the four group captions and each task row state', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverviewWithCommodityTypeSaved(POTATOES);

    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrlPattern(reference));
    await expect(plantsPages.overview.heading).toBeVisible();

    await expect(plantsPages.overview.journeyStrip).toBeVisible();
    await expect(plantsPages.overview.statusTag).toHaveText('Draft');
    await expect(plantsPages.overview.notificationReference).toHaveText(reference);
    await expect(plantsPages.overview.stripCancelAmend).toHaveCount(0);

    await expect(plantsPages.overview.taskLists).toHaveCount(4);
    await expect(plantsPages.overview.groupHeadings).toHaveText(GROUP_CAPTIONS);
    await expect(plantsPages.overview.taskRowLink('What are you importing?')).toHaveAttribute(
      'href',
      plantsPages.commodityType.expectedUrlOnTrail(reference, [TRAIL_START.overview]),
    );
    await expect(plantsPages.overview.taskRow('What are you importing?')).toContainText('In progress');

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

  test('the Overview groups its four numbered groups as named regions inside one Notification tasklist region', async ({
    plantsPages,
    plantsJourney,
  }) => {
    await plantsJourney.startNotification();
    await plantsJourney.toOverviewWithCommodityTypeSaved(POTATOES);

    await expect(plantsPages.overview.taskListRegion.getByRole('region')).toHaveCount(GROUP_CAPTIONS.length);
    for (const caption of GROUP_CAPTIONS) {
      const group = plantsPages.overview.groupRegion(caption);
      await expect(group.getByRole('heading', { level: 2 })).toHaveText(caption);
      await expect(group.getByRole('list')).toHaveCount(1);
    }
    await expect(plantsPages.overview.mainSecondLevelHeadings).toHaveText(GROUP_CAPTIONS);
  });

  test('the new draft is listed on the dashboard and Resume reopens it', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverviewWithCommodityTypeSaved(POTATOES);
    await plantsJourney.returnToDashboard();
    await plantsPages.dashboard.searchForReference(reference);

    await expect(plantsPages.dashboard.notificationCard(reference)).toBeVisible();
    await expect(plantsPages.dashboard.cardStatusTag(reference)).toHaveText('Draft');

    await plantsPages.dashboard.resume(reference).click();

    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrlPattern(reference));
    await expect(plantsPages.overview.heading).toBeVisible();
  });

  test('No, return to dashboard leaves the notification untouched', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.toOverviewWithCommodityTypeSaved(POTATOES);
    await plantsJourney.returnToDashboard();
    await plantsJourney.deleteFromDashboard(reference);

    await expect(pages.page).toHaveURL(plantsPages.deleteNotification.expectedUrlPattern(reference));
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
    await plantsJourney.toOverviewWithCommodityTypeSaved(POTATOES);
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

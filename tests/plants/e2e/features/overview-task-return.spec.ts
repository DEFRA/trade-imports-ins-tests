import { test, expect } from '@fixtures';
import { PLANTS_FOR_PLANTING, plantsLine } from '@flows/plants/journey';

const ARRIVAL_TASK_ROW = 'Arrival details';
const COMMODITIES_TASK_ROW = 'What are you importing?';

const NOT_YET_ARRIVED = 'No, it has not arrived yet';

const ARRIVING_ON = '27/3/2027';

test.describe('High-risk plants overview task return', () => {
  test('arrival details opened from the overview returns to the overview, not the place of destination', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toArrivalStatusOfNewPlantsNotification();
    await plantsJourney.answerArrivalStatus(NOT_YET_ARRIVED);
    await plantsPages.arrivalDetails.arrivalDate.fill(ARRIVING_ON);
    await plantsPages.arrivalDetails.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrl(reference));

    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRowLink(ARRIVAL_TASK_ROW)).toHaveAttribute(
      'href',
      plantsPages.arrivalStatus.expectedUrl(reference),
    );
    await plantsPages.overview.taskRowLink(ARRIVAL_TASK_ROW).click();
    await expect(pages.page).toHaveURL(plantsPages.arrivalStatus.expectedUrl(reference));

    await plantsPages.arrivalStatus.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));

    await plantsPages.arrivalDetails.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
    await expect(plantsPages.overview.taskRow(ARRIVAL_TASK_ROW)).toContainText('Completed');
  });

  test("'What are you importing?' opened from the overview moves through its own pages before returning to the overview", async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(PLANTS_FOR_PLANTING);
    await plantsJourney.addCommodityLine(PLANTS_FOR_PLANTING, plantsLine);

    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRowLink(COMMODITIES_TASK_ROW)).toHaveAttribute(
      'href',
      plantsPages.commodityType.expectedUrl(reference),
    );
    await plantsPages.overview.taskRowLink(COMMODITIES_TASK_ROW).click();
    await expect(pages.page).toHaveURL(plantsPages.commodityType.expectedUrl(reference));

    await plantsPages.commodityType.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.commodities.expectedUrl(reference));

    await plantsPages.commodities.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
  });
});

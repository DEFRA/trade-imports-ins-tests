import { test, expect } from '@fixtures';
import type { PlantsJourney } from '@flows/plants/journey';
import { getRelativeAppDateText } from '@utils/date-utils';

const POTATOES = 'Potatoes (seed or ware)';
const PLANTS_FOR_PLANTING = 'Plants for planting';

const SEED_POTATOES = 'Seed potatoes';

const GERMANY = 'Germany';
const FRANCE = 'France';

const ARRIVAL_TASK_ROW = 'Arrival details';

const ALREADY_ARRIVED = 'Yes, it has already arrived';
const NOT_YET_ARRIVED = 'No, it has not arrived yet';

const ARRIVAL_STATUS_ERROR = 'Select whether the consignment has arrived';

const ARRIVAL_DATE_ERROR = 'Enter the arrival date';
const REAL_ARRIVAL_DATE_ERROR = 'Enter a real arrival date';
const ARRIVAL_TIME_ERROR = 'Enter the expected time of arrival';
const PLACE_OF_LANDING_ERROR = 'Select the proposed place of landing';
const REAL_TIME_ERROR = 'Enter a real time, like 14:30';

// Hours run to 23, so 25:00 is well-formed but names no time.
const NOT_ON_THE_CLOCK = '25:00';

// February has no 31st, so the text is a well-formed date that names no day.
const NOT_A_REAL_DATE = '31/2/2026';

// The one date field means three different things, and the label is the only
// thing that says which — so each sentence is matched in full.
const POTATO_DATE_LABEL = 'Expected date of arrival';
const PRE_ARRIVAL_DATE_LABEL = 'Expected date of landing in Great Britain';
const POST_ARRIVAL_DATE_LABEL = 'Date the consignment first arrived in Great Britain';

// Arrival details now runs on into the destination section. That page asks its
// question in the state the arrival answer puts the notification in, and the
// heading is the only thing that says which — so it is matched in full.
const PRE_ARRIVAL_DESTINATION_HEADING = 'Place of destination';
const POST_ARRIVAL_DESTINATION_HEADING = 'Where is the consignment now?';

// Far enough past the four-day window (reg 26(1)) that the notification is
// unmistakably late.
const DAYS_LATE = 30;

// A consignment that has already arrived cannot have arrived tomorrow, so the
// post-arrival date is capped at today. Read off the service's own clock
// rather than written down: the claim is that this date is long past *today*,
// which a fixed date stops making as that upper bound moves with the calendar.
const ARRIVED_ON = getRelativeAppDateText({ dayOffset: -DAYS_LATE });

// Nothing bounds an expected date, so the pre-arrival one may sit ahead of the
// clock without the test tracking it.
const ARRIVING_ON = '27/3/2027';
const ARRIVING_AT = '14:30';

// A port the reference data has held throughout, offered as "{name} ({code})".
const ABERDEEN_HARBOUR = 'Aberdeen Harbour (GB ABD)';

// The window is four days (reg 26(1)), and the hint is the only place a trader
// reads it — so it is matched in full rather than on the number alone.
const POST_ARRIVAL_HINT =
  'You are making a post-arrival notification. It must be made no later than 4 days after the date of arrival. You will give the date it arrived and where it is now.';

const PRE_ARRIVAL_HINT =
  'You are making a pre-arrival notification. You will give the expected date of landing and the intended destination.';

const potatoLine = {
  Variety: 'Maris Piper',
  Quantity: '250',
  'Intended use': 'Planting',
};

const plantsLine = {
  Genus: 'Quercus (oak)',
  Species: 'Quercus robur',
  'Commodity code': '0602 20 20',
  Quantity: '120',
  'EPPO code': 'QUERO',
};

/** Reaches the arrival-status page on a plants-for-planting notification, the
 * shortest journey that is asked the question. */
const toArrivalStatus = async (plantsJourney: PlantsJourney): Promise<string> => {
  const reference = await plantsJourney.startNotification();
  await plantsJourney.chooseCommodityType(PLANTS_FOR_PLANTING);
  await plantsJourney.addCommodityLine(PLANTS_FOR_PLANTING, plantsLine);
  await plantsJourney.toOrigin();
  await plantsJourney.toArrivalStatus(GERMANY);
  return reference;
};

/** Reaches the arrival details on a seed-potato notification, which is never
 * asked the arrival-status question. */
const toPotatoArrivalDetails = async (plantsJourney: PlantsJourney): Promise<string> => {
  const reference = await plantsJourney.startNotification();
  await plantsJourney.chooseCommodityType(POTATOES);
  await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine);
  await plantsJourney.toOrigin();
  await plantsJourney.toArrivalDetails(FRANCE);
  return reference;
};

test.describe('High-risk plants arrival section', { tag: '@integration' }, () => {
  test('the arrival-status question offers both branches, and the post-arrival one quotes the window', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await toArrivalStatus(plantsJourney);

    await expect(pages.page).toHaveURL(plantsPages.arrivalStatus.expectedUrl(reference));
    await expect(plantsPages.arrivalStatus.heading).toBeVisible();
    await expect(plantsPages.arrivalStatus.arrivalStatus(ALREADY_ARRIVED)).not.toBeChecked();
    await expect(plantsPages.arrivalStatus.arrivalStatus(NOT_YET_ARRIVED)).not.toBeChecked();
    await expect(plantsPages.arrivalStatus.arrivalStatusHint(ALREADY_ARRIVED)).toHaveText(POST_ARRIVAL_HINT);
    await expect(plantsPages.arrivalStatus.arrivalStatusHint(NOT_YET_ARRIVED)).toHaveText(PRE_ARRIVAL_HINT);
  });

  test('the question must be answered before the notification moves on', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await toArrivalStatus(plantsJourney);

    await plantsPages.arrivalStatus.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalStatus.expectedUrl(reference));
    await expect(plantsPages.arrivalStatus.errorSummary).toContainText(ARRIVAL_STATUS_ERROR);
  });

  test('the answer is saved, shown again on return, and carries on to the arrival details', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await toArrivalStatus(plantsJourney);

    await plantsPages.arrivalStatus.arrivalStatus(ALREADY_ARRIVED).check();
    await plantsPages.arrivalStatus.btnSaveAndContinue.click();

    // Arrival-details follows the question in the same section, so Continue
    // goes on to it rather than back to the Overview.
    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));

    await plantsPages.arrivalStatus.open(reference);
    await expect(plantsPages.arrivalStatus.arrivalStatus(ALREADY_ARRIVED)).toBeChecked();
  });

  test('the arrival date is asked under the sentence the arrival status chose', async ({ plantsPages, plantsJourney }) => {
    await toArrivalStatus(plantsJourney);
    await plantsJourney.answerArrivalStatus(NOT_YET_ARRIVED);

    // The one date field means three different things, and the label is the
    // only place a trader reads which of them is being asked for.
    await expect(plantsPages.arrivalDetails.dateQuestionLabelled(PRE_ARRIVAL_DATE_LABEL)).toBeVisible();

    // Plants and wood are asked for a date alone: reg 24A(2)(a) and (aa) give
    // the time and the place of landing to potatoes only.
    await expect(plantsPages.arrivalDetails.arrivalTime).toHaveCount(0);
    await expect(plantsPages.arrivalDetails.proposedPlaceOfLanding).toHaveCount(0);
  });

  test('the arrival date must be given before the notification moves on', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await toArrivalStatus(plantsJourney);
    await plantsJourney.answerArrivalStatus(ALREADY_ARRIVED);

    await plantsPages.arrivalDetails.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(ARRIVAL_DATE_ERROR);
  });

  test('a date long past the four-day window is saved, shown again on return, and completes the arrival task row', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await toArrivalStatus(plantsJourney);
    await plantsJourney.answerArrivalStatus(ALREADY_ARRIVED);

    await expect(plantsPages.arrivalDetails.dateQuestionLabelled(POST_ARRIVAL_DATE_LABEL)).toBeVisible();
    await plantsPages.arrivalDetails.arrivalDate.fill(ARRIVED_ON);
    await plantsPages.arrivalDetails.btnSaveAndContinue.click();

    // Reg 26(1) gives the notifier four days, but a notification made after
    // them is late rather than void: nothing lower-bounds the date, so the
    // service takes it and completes the row instead of refusing the save.
    // Arrival-details is followed by the destination section, so Continue asks
    // the next question — and this notification has already arrived, so it is
    // asked where the consignment is being kept now.
    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrl(reference));
    await expect(plantsPages.placeOfDestination.headingNamed(POST_ARRIVAL_DESTINATION_HEADING)).toBeVisible();

    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRow(ARRIVAL_TASK_ROW)).toContainText('Completed');

    await plantsPages.arrivalDetails.open(reference);
    await expect(plantsPages.arrivalDetails.arrivalDate).toHaveValue(ARRIVED_ON);
  });

  test('changing the answer from arrived to not arrived re-labels the question and keeps the date', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await toArrivalStatus(plantsJourney);
    await plantsJourney.answerArrivalStatus(ALREADY_ARRIVED);
    await plantsPages.arrivalDetails.arrivalDate.fill(ARRIVED_ON);
    await plantsPages.arrivalDetails.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrl(reference));

    await plantsPages.arrivalStatus.open(reference);
    await plantsPages.arrivalStatus.arrivalStatus(NOT_YET_ARRIVED).check();
    await plantsPages.arrivalStatus.btnSaveAndContinue.click();

    // Every notification owes a date and both branches of the question ask for
    // one, so `arrivalDate` is ungated: the new answer changes the sentence it
    // is asked under and leaves the answer itself alone. Nothing takes it out
    // of scope, so the engine has nothing to purge.
    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.dateQuestionLabelled(PRE_ARRIVAL_DATE_LABEL)).toBeVisible();
    await expect(plantsPages.arrivalDetails.arrivalDate).toHaveValue(ARRIVED_ON);
  });

  test('a date that names no day on the calendar is refused', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await toArrivalStatus(plantsJourney);
    await plantsJourney.answerArrivalStatus(NOT_YET_ARRIVED);

    await plantsPages.arrivalDetails.arrivalDate.fill(NOT_A_REAL_DATE);
    await plantsPages.arrivalDetails.btnSaveAndContinue.click();

    // A missing date and an impossible one are different mistakes, so the page
    // says which one was made rather than repeating the required message.
    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(REAL_ARRIVAL_DATE_ERROR);
    await expect(plantsPages.arrivalDetails.errorSummary).not.toContainText(ARRIVAL_DATE_ERROR);
  });

  test('a potato notification is never asked the question and opens the arrival row on the details', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine);
    await plantsJourney.toOrigin();

    await plantsPages.origin.selectCountry(FRANCE);
    await plantsPages.origin.btnSaveAndContinue.click();

    // Reg 24A gives the potato notification no post-arrival branch, so
    // `arrivalStatus` is out of scope: the opening run passes the step over and
    // lands on the details, the page every commodity type answers.
    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.dateQuestionLabelled(POTATO_DATE_LABEL)).toBeVisible();

    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRowLink(ARRIVAL_TASK_ROW)).toHaveAttribute(
      'href',
      plantsPages.arrivalDetails.expectedUrl(reference),
    );
  });

  test('save and return to overview: when a potato arrival page is blank, saves it and leaves the arrival row incomplete', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await toPotatoArrivalDetails(plantsJourney);

    await plantsPages.arrivalDetails.btnSaveAndReturnToOverview.click();

    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
    await expect(plantsPages.overview.taskRow(ARRIVAL_TASK_ROW)).not.toContainText('Completed');
  });

  test('save and return to overview: when the time is not on the 24-hour clock, refuses the save', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await toPotatoArrivalDetails(plantsJourney);

    await plantsPages.arrivalDetails.arrivalDate.fill(ARRIVING_ON);
    await plantsPages.arrivalDetails.arrivalTime.fill(NOT_ON_THE_CLOCK);
    await plantsPages.arrivalDetails.selectPlaceOfLanding(ABERDEEN_HARBOUR);
    await plantsPages.arrivalDetails.btnSaveAndReturnToOverview.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(REAL_TIME_ERROR);

    await plantsPages.overview.open(reference);
    await plantsPages.overview.taskRowLink(ARRIVAL_TASK_ROW).click();
    await expect(plantsPages.arrivalDetails.arrivalTime).toHaveValue('');
    await expect(plantsPages.arrivalDetails.arrivalDate).toHaveValue('');
    await expect(plantsPages.arrivalDetails.proposedPlaceOfLanding).toHaveValue('');
  });

  test('save and return to overview: when a date is typed, saves it and shows it again on return', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await toArrivalStatus(plantsJourney);
    await plantsJourney.answerArrivalStatus(ALREADY_ARRIVED);

    await plantsPages.arrivalDetails.arrivalDate.fill(ARRIVED_ON);
    await plantsPages.arrivalDetails.btnSaveAndReturnToOverview.click();

    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));

    await plantsPages.arrivalDetails.open(reference);
    await expect(plantsPages.arrivalDetails.arrivalDate).toHaveValue(ARRIVED_ON);
  });

  test('a potato notification is asked the time and the place of landing as well as the date', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await toPotatoArrivalDetails(plantsJourney);

    await plantsPages.arrivalDetails.btnSaveAndContinue.click();

    // All three are mandatory for potatoes, so an empty page names all three.
    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(ARRIVAL_DATE_ERROR);
    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(ARRIVAL_TIME_ERROR);
    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(PLACE_OF_LANDING_ERROR);

    await plantsPages.arrivalDetails.arrivalDate.fill(ARRIVING_ON);
    await plantsPages.arrivalDetails.arrivalTime.fill(ARRIVING_AT);
    await plantsPages.arrivalDetails.selectPlaceOfLanding(ABERDEEN_HARBOUR);
    await plantsPages.arrivalDetails.btnSaveAndContinue.click();

    // Reg 24A gives potatoes no post-arrival branch, so the destination
    // question is asked in its own state: the pre-arrival question.
    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrl(reference));
    await expect(plantsPages.placeOfDestination.headingNamed(PRE_ARRIVAL_DESTINATION_HEADING)).toBeVisible();

    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRow(ARRIVAL_TASK_ROW)).toContainText('Completed');

    await plantsPages.arrivalDetails.open(reference);
    await expect(plantsPages.arrivalDetails.arrivalDate).toHaveValue(ARRIVING_ON);
    await expect(plantsPages.arrivalDetails.arrivalTime).toHaveValue(ARRIVING_AT);
    await expect(plantsPages.arrivalDetails.proposedPlaceOfLanding).toHaveValue(ABERDEEN_HARBOUR);
  });

  test("a potato notification's arrival questions are set in the medium label size, and the place of landing is hinted as the port of entry is", async ({
    plantsPages,
    plantsJourney,
  }) => {
    await toPotatoArrivalDetails(plantsJourney);

    for (const id of ['arrivalDate', 'arrivalTime', 'proposedPlaceOfLanding']) {
      await expect(plantsPages.arrivalDetails.questionLabel(id)).toHaveClass(/govuk-label--m/);
    }
    await expect(plantsPages.arrivalDetails.placeOfLandingHint).toHaveText(
      'Select where the potatoes will enter Great Britain. Start typing to search by port or airport name or code.',
    );
  });

  test("a plants notification's date question is set in the medium label size, before and after arrival", async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await toArrivalStatus(plantsJourney);
    await plantsJourney.answerArrivalStatus(NOT_YET_ARRIVED);
    await expect(plantsPages.arrivalDetails.dateQuestionLabelled(PRE_ARRIVAL_DATE_LABEL)).toBeVisible();
    await expect(plantsPages.arrivalDetails.questionLabel('arrivalDate')).toHaveClass(/govuk-label--m/);

    await plantsPages.arrivalStatus.open(reference);
    await plantsPages.arrivalStatus.arrivalStatus(ALREADY_ARRIVED).check();
    await plantsPages.arrivalStatus.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.dateQuestionLabelled(POST_ARRIVAL_DATE_LABEL)).toBeVisible();
    await expect(plantsPages.arrivalDetails.questionLabel('arrivalDate')).toHaveClass(/govuk-label--m/);
  });
});

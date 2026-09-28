import { test, expect } from '@fixtures';
import type { PageObjects } from '@page-objects';
import type { PlantsJourney } from '@flows/plants-journey';

const POTATOES = 'Potatoes (seed or ware)';
const PLANTS_FOR_PLANTING = 'Plants for planting';

const SEED_POTATOES = 'Seed potatoes';

const FRANCE = 'France';
const GERMANY = 'Germany';

const DESTINATION_TASK_ROW = 'Place of destination';

const ALREADY_ARRIVED = 'Yes, it has already arrived';
const NOT_YET_ARRIVED = 'No, it has not arrived yet';

// One page asks three questions and the heading is the only thing that says
// which, so each is matched in full rather than on a shared fragment.
const PRE_ARRIVAL_DESTINATION_HEADING = 'Place of destination';
const POST_ARRIVAL_DESTINATION_HEADING = 'Where is the consignment now?';

const DESTINATION_REQUIRED_ERROR = 'Select a place of destination from the list';

const INTENDED_DESTINATION_DESCRIPTION =
  'Where the goods will be kept after arrival. This is where a plant health inspector may carry out a spot check.';
const POST_ARRIVAL_DESTINATION_DESCRIPTION =
  'Give the address where the consignment is being kept. If it is still on its way to its intended destination, give that destination. A plant health inspector may carry out a spot check here.';

// Nothing bounds an expected date, so it may sit ahead of the clock without the
// test tracking it.
const ARRIVING_ON = '27/3/2027';
const ARRIVING_AT = '14:30';

// A port the reference data has held throughout, offered as "{name} ({code})".
const ABERDEEN_HARBOUR = 'Aberdeen Harbour (GB ABD)';

// The picker shows five rows a page (design 05-03..06), whatever page size the
// address-book API itself serves.
const PICKER_PAGE_SIZE = 5;

const FULL_BOOK_CAPTION = new RegExp(`Showing ${PICKER_PAGE_SIZE} of \\d+ addresses`);

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

/** A record only this run can find: the address book is shared across workers
 * and never wiped, so anything that counts rows has to search its own token. */
const addressNamed = (name: string) => ({
  name,
  addressLine1: '4 Nursery Lane',
  townOrCity: 'Perth',
  postcode: 'PH1 5EX',
  countryCode: 'GB',
  phone: '01738 555 0143',
  email: 'destination@example.co.uk',
});

/**
 * A plants-for-planting notification walked to the destination page. The
 * consignor page follows it in the opening run, so saving here continues there
 * rather than to the Overview. The arrival answer decides which of the three
 * questions the page asks, so the caller names it.
 */
const plantsToDestination = async (pages: PageObjects, plantsJourney: PlantsJourney, arrivalStatus: string): Promise<string> => {
  const reference = await plantsJourney.startNotification();
  await plantsJourney.chooseCommodityType(PLANTS_FOR_PLANTING);
  await plantsJourney.addCommodityLine(PLANTS_FOR_PLANTING, plantsLine);
  await plantsJourney.toOrigin();
  await plantsJourney.toArrivalStatus(GERMANY);
  await plantsJourney.answerArrivalStatus(arrivalStatus);
  await pages.plantsArrivalDetails.arrivalDate.fill(ARRIVING_ON);
  await pages.plantsArrivalDetails.btnSaveAndContinue.click();
  await pages.plantsPlaceOfDestination.heading.waitFor();
  return reference;
};

/**
 * A seed-potato notification walked to the same page. Potatoes are never asked
 * whether the consignment has arrived — reg 24A gives them no post-arrival
 * branch — and they owe a time and a place of landing that nothing else does.
 */
const potatoesToDestination = async (pages: PageObjects, plantsJourney: PlantsJourney): Promise<string> => {
  const reference = await plantsJourney.startNotification();
  await plantsJourney.chooseCommodityType(POTATOES);
  await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine);
  await plantsJourney.toOrigin();
  await plantsJourney.toArrivalDetails(FRANCE);
  await pages.plantsArrivalDetails.arrivalDate.fill(ARRIVING_ON);
  await pages.plantsArrivalDetails.arrivalTime.fill(ARRIVING_AT);
  await pages.plantsArrivalDetails.selectPlaceOfLanding(ABERDEEN_HARBOUR);
  await pages.plantsArrivalDetails.btnSaveAndContinue.click();
  await pages.plantsPlaceOfDestination.heading.waitFor();
  return reference;
};

/** Picks the one address this test minted and saves it, which carries the
 * opening run on to the consignor page. */
const chooseAddress = async (pages: PageObjects, token: string, name: string): Promise<void> => {
  await pages.plantsPlaceOfDestination.searchFor(token);
  await pages.plantsPlaceOfDestination.address(name).check();
  await pages.plantsPlaceOfDestination.btnSaveAndContinue.click();
};

test.describe('High-risk plants destination section', { tag: '@integration' }, () => {
  test('the question is asked in the state the arrival answer put the notification in', async ({ pages, plantsJourney }) => {
    const reference = await plantsToDestination(pages, plantsJourney, NOT_YET_ARRIVED);

    await expect(pages.page).toHaveURL(pages.plantsPlaceOfDestination.expectedUrl(reference));
    await expect(pages.plantsPlaceOfDestination.headingNamed(PRE_ARRIVAL_DESTINATION_HEADING)).toBeVisible();
    await expect(pages.plantsPlaceOfDestination.descriptionNamed(INTENDED_DESTINATION_DESCRIPTION)).toBeVisible();

    // The state is read from the arrival answer on every render rather than
    // stored with the destination, so re-answering the arrival question
    // re-asks this one.
    await pages.plantsArrivalStatus.open(reference);
    await plantsJourney.answerArrivalStatus(ALREADY_ARRIVED);

    await pages.plantsPlaceOfDestination.open(reference);
    await expect(pages.plantsPlaceOfDestination.headingNamed(POST_ARRIVAL_DESTINATION_HEADING)).toBeVisible();
    await expect(pages.plantsPlaceOfDestination.descriptionNamed(POST_ARRIVAL_DESTINATION_DESCRIPTION)).toBeVisible();
  });

  test('a potato notification is asked for the place of destination', async ({ pages, plantsJourney }) => {
    const reference = await potatoesToDestination(pages, plantsJourney);

    // Potatoes have no arrival status to read, so the page is asked in its
    // pre-arrival state without the trader ever having chosen one.
    await expect(pages.page).toHaveURL(pages.plantsPlaceOfDestination.expectedUrl(reference));
    await expect(pages.plantsPlaceOfDestination.headingNamed(PRE_ARRIVAL_DESTINATION_HEADING)).toBeVisible();
    await expect(pages.plantsPlaceOfDestination.descriptionNamed(INTENDED_DESTINATION_DESCRIPTION)).toBeVisible();
  });

  test('an address must be chosen before the notification moves on', async ({ pages, plantsJourney }) => {
    const reference = await plantsToDestination(pages, plantsJourney, NOT_YET_ARRIVED);

    await pages.plantsPlaceOfDestination.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsPlaceOfDestination.expectedUrl(reference));
    await expect(pages.plantsPlaceOfDestination.errorSummary).toContainText(DESTINATION_REQUIRED_ERROR);
  });

  test('search narrows the organisation address book, and a term nothing matches says so', async ({
    pages,
    plantsJourney,
    addressBookApi,
  }) => {
    const token = `Kirkcaldy${Date.now()}`;
    const matches = [`Highland Nurseries ${token}`, `Tayside Growers ${token}`];
    for (const name of matches) {
      await addressBookApi.createAddress(addressNamed(name));
    }

    await plantsToDestination(pages, plantsJourney, NOT_YET_ARRIVED);

    // The picker opens on the whole book, however many addresses the
    // organisation has saved by now.
    await expect(pages.plantsPlaceOfDestination.resultsCaption).toHaveText(FULL_BOOK_CAPTION);

    await pages.plantsPlaceOfDestination.searchFor(token);

    await expect(pages.plantsPlaceOfDestination.resultsCaption).toHaveText('Showing 2 of 2 addresses');
    await expect(pages.plantsPlaceOfDestination.address(matches[0])).toBeVisible();
    await expect(pages.plantsPlaceOfDestination.address(matches[1])).toBeVisible();

    await pages.plantsPlaceOfDestination.searchFor(`${token} Ardnamurchan`);

    // Nothing matching is a sentence, not an empty table.
    await expect(pages.plantsPlaceOfDestination.noMatches).toBeVisible();
    await expect(pages.plantsPlaceOfDestination.resultsCaption).toHaveCount(0);

    // Clearing the search restores the whole book.
    await pages.plantsPlaceOfDestination.searchFor('');
    await expect(pages.plantsPlaceOfDestination.resultsCaption).toHaveText(FULL_BOOK_CAPTION);
  });

  test('results are paged five at a time, and a row ticked on a later page is the one that saves', async ({
    pages,
    plantsJourney,
    addressBookApi,
  }) => {
    const token = `Peterhead${Date.now()}`;
    const target = `Target Nursery ${token}`;
    // The target first, then a full page of newer ones: the book lists newest
    // first, so those five fill page one and push the target onto page two.
    await addressBookApi.createAddress(addressNamed(target));
    for (let newer = 0; newer < PICKER_PAGE_SIZE; newer += 1) {
      await addressBookApi.createAddress(addressNamed(`Newer Than Target ${token} ${newer}`));
    }

    const reference = await plantsToDestination(pages, plantsJourney, NOT_YET_ARRIVED);
    await pages.plantsPlaceOfDestination.searchFor(token);

    await expect(pages.plantsPlaceOfDestination.resultsCaption).toHaveText('Showing 5 of 6 addresses');
    await expect(pages.plantsPlaceOfDestination.address(target)).toHaveCount(0);

    // Paging is a link, not a submit, and it carries the search term with it.
    await pages.plantsPlaceOfDestination.pageLink(2).click();
    await expect(pages.plantsPlaceOfDestination.resultsCaption).toHaveText('Showing 1 of 6 addresses');

    await pages.plantsPlaceOfDestination.address(target).check();
    await pages.plantsPlaceOfDestination.btnSaveAndContinue.click();

    // The consignor page follows the destination in the opening run, so
    // Continue reaches that rather than the Overview.
    await expect(pages.page).toHaveURL(pages.plantsConsignorSelect.expectedUrl(reference));

    await pages.plantsOverview.open(reference);
    await expect(pages.plantsOverview.taskRow(DESTINATION_TASK_ROW)).toContainText('Completed');

    // Re-entering opens on page one of the whole book, where the chosen record
    // is not rendered — the picker still knows it, and says so in the inset.
    // That is the no-JS selection-across-pagination guarantee.
    await pages.plantsPlaceOfDestination.open(reference);
    await expect(pages.plantsPlaceOfDestination.selectedAddress(target)).toBeVisible();
    await expect(pages.plantsPlaceOfDestination.address(target)).toHaveCount(0);
  });

  test('deleting the chosen address takes the answer off the notification', async ({ pages, plantsJourney, addressBookApi }) => {
    const token = `Montrose${Date.now()}`;
    const name = `Doomed Nursery ${token}`;
    const record = await addressBookApi.createAddress(addressNamed(name));

    const reference = await plantsToDestination(pages, plantsJourney, NOT_YET_ARRIVED);
    await chooseAddress(pages, token, name);

    await expect(pages.page).toHaveURL(pages.plantsConsignorSelect.expectedUrl(reference));

    await pages.plantsOverview.open(reference);
    await expect(pages.plantsOverview.taskRow(DESTINATION_TASK_ROW)).toContainText('Completed');

    // The notification holds the address-book id and nothing else, so the
    // organisation deleting the record leaves a reference that no longer
    // resolves. A deleted address counts as never entered: the answer drops out
    // of the read, and the hub and the page agree it is gone rather than one of
    // them showing an address the trader can no longer see. The Check your
    // answers half of this — a deleted record rendering "Not provided" — is
    // carried to the review-section spec (inc-055): the plants frontend has no
    // check-answers feature yet.
    await addressBookApi.deleteAddress(record.id);

    await pages.plantsOverview.open(reference);
    await expect(pages.plantsOverview.taskRow(DESTINATION_TASK_ROW)).toContainText('Not yet started');

    await pages.plantsPlaceOfDestination.open(reference);
    await expect(pages.plantsPlaceOfDestination.headingNamed(PRE_ARRIVAL_DESTINATION_HEADING)).toBeVisible();
    await expect(pages.plantsPlaceOfDestination.selectedAddressInset).toHaveCount(0);
  });
});

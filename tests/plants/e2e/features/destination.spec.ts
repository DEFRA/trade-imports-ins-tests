import { test, expect } from '@fixtures';
import { PLANTS_FOR_PLANTING, POTATOES, nurseryAddress } from '@flows/plants/journey';

const DESTINATION_TASK_ROW = 'Place of destination';

const ALREADY_ARRIVED = 'Yes, it has already arrived';

const PRE_ARRIVAL_DESTINATION_HEADING = 'Place of destination';
const POST_ARRIVAL_DESTINATION_HEADING = 'Where is the consignment now?';

const INTENDED_DESTINATION_DESCRIPTION =
  'Where the goods will be kept after arrival. This is where a plant health inspector may carry out a spot check.';
const POST_ARRIVAL_DESTINATION_DESCRIPTION =
  'Give the address where the consignment is being kept. If it is still on its way to its intended destination, give that destination. A plant health inspector may carry out a spot check here.';

const PICKER_PAGE_SIZE = 5;

const FULL_BOOK_COUNT = new RegExp(`Showing ${PICKER_PAGE_SIZE} out of \\d+ results`);

test.describe('High-risk plants destination section', () => {
  test('the question is asked in the state the arrival answer put the notification in', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toDestinationOfNewNotification(PLANTS_FOR_PLANTING);

    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrl(reference));
    await expect(plantsPages.placeOfDestination.headingNamed(PRE_ARRIVAL_DESTINATION_HEADING)).toBeVisible();
    await expect(plantsPages.placeOfDestination.descriptionNamed(INTENDED_DESTINATION_DESCRIPTION)).toBeVisible();

    await plantsPages.arrivalStatus.open(reference);
    await plantsJourney.answerArrivalStatus(ALREADY_ARRIVED);

    await plantsPages.placeOfDestination.open(reference);
    await expect(plantsPages.placeOfDestination.headingNamed(POST_ARRIVAL_DESTINATION_HEADING)).toBeVisible();
    await expect(plantsPages.placeOfDestination.descriptionNamed(POST_ARRIVAL_DESTINATION_DESCRIPTION)).toBeVisible();
  });

  test('a potato notification is asked for the place of destination', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toDestinationOfNewNotification(POTATOES);

    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrl(reference));
    await expect(plantsPages.placeOfDestination.headingNamed(PRE_ARRIVAL_DESTINATION_HEADING)).toBeVisible();
    await expect(plantsPages.placeOfDestination.descriptionNamed(INTENDED_DESTINATION_DESCRIPTION)).toBeVisible();
  });

  test('saving with nothing chosen moves on to the consignor page and leaves the destination not yet started', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toDestinationOfNewNotification(PLANTS_FOR_PLANTING);

    await plantsPages.placeOfDestination.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.consignorSelect.expectedUrl(reference));
    await expect(plantsPages.consignorSelect.heading).toBeVisible();

    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRow(DESTINATION_TASK_ROW)).toContainText('Not yet started');
  });

  test('search narrows the organisation address book, and a term nothing matches says so', async ({
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const token = `Kirkcaldy${Date.now()}`;
    const matches = [`Highland Nurseries ${token}`, `Tayside Growers ${token}`];
    for (const name of matches) {
      await addressBookApi.createAddress(nurseryAddress(name));
    }

    await plantsJourney.toDestinationOfNewNotification(PLANTS_FOR_PLANTING);

    await expect(plantsPages.placeOfDestination.resultsSummary).toHaveText(FULL_BOOK_COUNT);

    await plantsPages.placeOfDestination.searchFor(token);

    await expect(plantsPages.placeOfDestination.resultsSummary).toHaveText('Showing 2 out of 2 results');
    await expect(plantsPages.placeOfDestination.address(matches[0])).toBeVisible();
    await expect(plantsPages.placeOfDestination.address(matches[1])).toBeVisible();

    await plantsPages.placeOfDestination.searchFor(`${token} Ardnamurchan`);

    await expect(plantsPages.placeOfDestination.noMatchesMessage).toBeVisible();

    await plantsPages.placeOfDestination.searchFor('');
    await expect(plantsPages.placeOfDestination.resultsSummary).toHaveText(FULL_BOOK_COUNT);
  });

  test('results are paged five at a time, and a row ticked on a later page is the one that saves', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const token = `Peterhead${Date.now()}`;
    const target = `Target Nursery ${token}`;
    await addressBookApi.createAddress(nurseryAddress(target));
    for (let newer = 0; newer < PICKER_PAGE_SIZE; newer += 1) {
      await addressBookApi.createAddress(nurseryAddress(`Newer Than Target ${token} ${newer}`));
    }

    const reference = await plantsJourney.toDestinationOfNewNotification(PLANTS_FOR_PLANTING);
    await plantsPages.placeOfDestination.searchFor(token);

    await expect(plantsPages.placeOfDestination.resultsSummary).toHaveText('Showing 5 out of 6 results');
    await expect(plantsPages.placeOfDestination.address(target)).toHaveCount(0);

    await plantsPages.placeOfDestination.pageLink(2).click();
    await expect(plantsPages.placeOfDestination.resultsSummary).toHaveText('Showing 1 out of 6 results');

    await plantsPages.placeOfDestination.address(target).check();
    await plantsPages.placeOfDestination.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.consignorSelect.expectedUrl(reference));

    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRow(DESTINATION_TASK_ROW)).toContainText('Completed');

    await plantsPages.placeOfDestination.open(reference);
    await expect(plantsPages.placeOfDestination.selectedAddress(target)).toBeVisible();
    await expect(plantsPages.placeOfDestination.address(target)).toHaveCount(0);
  });

  test(
    'deleting the chosen address from the address book leaves its copy on the notification',
    { tag: '@address-book' },
    async ({ pages, plantsPages, plantsJourney, addressBookApi }) => {
      const token = `Montrose${Date.now()}`;
      const name = `Deleted Nursery ${token}`;
      const record = await addressBookApi.createAddress(nurseryAddress(name));

      const reference = await plantsJourney.toDestinationOfNewNotification(PLANTS_FOR_PLANTING);
      await plantsJourney.chooseDestination(name);

      await expect(pages.page).toHaveURL(plantsPages.consignorSelect.expectedUrl(reference));

      await addressBookApi.deleteAddress(record.id);

      await plantsPages.overview.open(reference);
      await expect(plantsPages.overview.taskRow(DESTINATION_TASK_ROW)).toContainText('Completed');

      await plantsPages.placeOfDestination.open(reference);
      await expect(plantsPages.placeOfDestination.headingNamed(PRE_ARRIVAL_DESTINATION_HEADING)).toBeVisible();
      await expect(plantsPages.placeOfDestination.selectedAddressInset).toHaveCount(0);
      await expect(plantsPages.placeOfDestination.currentAddress).toContainText(name);
      await expect(plantsPages.placeOfDestination.currentAddress).toContainText('PH1 5EX');
    },
  );

  test('Edit details on the picker changes the copy on this notification, not the address book record', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const token = `Forfar${Date.now()}`;
    const name = `Copied Nursery ${token}`;
    const editedName = `Edited Nursery ${token}`;
    const record = await addressBookApi.createAddress(nurseryAddress(name));

    const reference = await plantsJourney.toDestinationOfNewNotification(PLANTS_FOR_PLANTING);
    await plantsJourney.chooseDestination(name);

    await plantsPages.placeOfDestination.open(reference);
    await plantsPages.placeOfDestination.editCurrentAddress.click();

    const form = plantsPages.placeOfDestinationEdit;
    await expect(pages.page).toHaveURL((url) => url.pathname === form.expectedUrl(reference));
    await expect(form.heading).toBeVisible();
    await expect(form.roleCaption).toBeVisible();
    await expect(form.name).toHaveValue(name);
    await expect(form.postcode).toHaveValue('PH1 5EX');

    await form.fill({ name: editedName, townOrCity: 'Dundee' });
    await form.saveChanges.click();

    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrl(reference));
    await expect(plantsPages.placeOfDestination.currentAddress).toContainText(editedName);
    await expect(plantsPages.placeOfDestination.currentAddress).toContainText('Dundee');

    expect(await addressBookApi.getAddress(record.id)).toMatchObject({ name, townOrCity: 'Perth' });
  });
});

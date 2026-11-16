import { test, expect } from '@fixtures';
import { PLANTS_FOR_PLANTING, type PlantsJourney } from '@flows/plants/journey';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { addressRoles } from '@domain/shared/constants/address-types';
import { expectNothingBetweenSearchAndResults } from '@page-objects/shared/address-picker-results';

const PICKER_CASES = [
  {
    pageName: 'place of destination',
    pickerKey: 'placeOfDestination',
    errorText: 'Select a place of destination from the list',
    role: addressRoles.placeOfDestination,
    openPicker: (plantsJourney: PlantsJourney) => plantsJourney.toDestinationOfNewNotification(PLANTS_FOR_PLANTING),
  },
  {
    pageName: 'consignor',
    pickerKey: 'consignorSelect',
    errorText: 'Select a consignor from the list',
    role: addressRoles.consignor,
    openPicker: async (plantsJourney: PlantsJourney, api: AddressBookApiClient) =>
      (await plantsJourney.toConsignorOfNewNotification(api, PLANTS_FOR_PLANTING)).reference,
  },
] as const;

test.describe('Addresses picker', { tag: '@address-book' }, () => {
  test('reopening the picker shows the chosen address checked, with nothing between the search box and the results heading, and shows nothing checked once the address is edited on the notification', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await plantsJourney.completeNotification(addressBookApi);
    const editedName = `Edited Destination ${address.name}`;

    await plantsPages.placeOfDestination.open(reference);
    await expect(plantsPages.placeOfDestination.address(address.name)).toBeChecked();
    await expectNothingBetweenSearchAndResults(plantsPages.placeOfDestination.resultsHeading);
    await expect(plantsPages.placeOfDestination.currentAddress).toContainText(address.name);

    await plantsPages.placeOfDestination.editCurrentAddress.click();
    await plantsPages.placeOfDestinationEdit.fill({ name: editedName });
    await plantsPages.placeOfDestinationEdit.saveChanges.click();

    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrlPattern(reference));
    await expect(plantsPages.placeOfDestination.currentAddress).toContainText(editedName);
    await expect(plantsPages.placeOfDestination.checkedAddress).toHaveCount(0);

    await plantsPages.placeOfDestination.open(reference);
    await expect(plantsPages.placeOfDestination.checkedAddress).toHaveCount(0);
  });

  for (const { pageName, pickerKey, errorText, role, openPicker } of PICKER_CASES) {
    test(`${pageName}: an address deleted after it was ticked is refused the same way on Save and return to overview and on Save and continue`, async ({
      pages,
      plantsPages,
      plantsJourney,
      addressBookApi,
    }) => {
      const picker = plantsPages[pickerKey];
      const reference = await openPicker(plantsJourney, addressBookApi);

      for (const save of [picker.saveAndReturnToOverview, picker.saveAndContinue]) {
        const { searchTerm } = await plantsJourney.createSearchTickThenDeleteAddress(addressBookApi, picker, role);
        await save.click();

        await expect(pages.page).toHaveURL(picker.expectedUrlPattern(reference));
        await expect(picker.errorSummaryLinks).toHaveText([errorText]);
        await expect(picker.searchBox).toHaveValue(searchTerm);
      }
    });
  }
});

import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { PLANTS_FOR_PLANTING, nurseryAddress, type PlantsJourney } from '@flows/plants/journey';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { addressRoles, heldAsPlaceOfDestination } from '@domain/shared/constants/address-types';
import { addressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import { frenchConsignorFixture, saveAddressThenExpectCountrySearchListsIt } from '@flows/shared/address-book-seed';
import {
  ADDRESSES_A_PAGE,
  expectChosenAddressNamedAboveResults,
  expectedPickerAddressCellText,
  pickerAddressCellText,
  pickerResultsCount,
} from '@page-objects/shared/address-picker-results';

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
  test('the picker shows eight matches a page and keeps the search term and the chosen address as the trader moves to the next page', async ({
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const token = `Dunkeld${randomUUID()}`;
    const names = Array.from({ length: ADDRESSES_A_PAGE + 1 }, (_, index) => `Paged Nursery ${index + 1} ${token}`);
    for (const name of names) {
      await addressBookApi.createAddress(nurseryAddress(name));
    }
    const chosenName = names[0];
    const picker = plantsPages.placeOfDestination;

    const reference = await plantsJourney.toDestinationOfNewNotification(PLANTS_FOR_PLANTING);
    await picker.search(chosenName);
    await picker.address(chosenName).check();
    await picker.saveAndContinue.click();
    await picker.open(reference);

    await picker.search(token);

    await expect(picker.resultsSummary).toHaveText(pickerResultsCount(ADDRESSES_A_PAGE, names.length));
    await expect(picker.listedAddresses).toHaveCount(ADDRESSES_A_PAGE);
    await expect(picker.pagination).toBeVisible();
    await expectChosenAddressNamedAboveResults(picker.resultsHeading, chosenName);

    await picker.paginationPageLink(2).click();

    await expect(picker.searchBox).toHaveValue(token);
    await expect(picker.resultsSummary).toHaveText(pickerResultsCount(1, names.length));
    await expectChosenAddressNamedAboveResults(picker.resultsHeading, chosenName);
    await expect(picker.listedAddresses).toHaveCount(1);
  });

  test('reopening the picker names the chosen address above the results and checks its row once its page is shown, and shows nothing checked once the address is edited on the notification', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await plantsJourney.completeNotification(addressBookApi);
    const editedName = `Edited Destination ${address.name}`;

    await plantsPages.placeOfDestination.open(reference);
    await expectChosenAddressNamedAboveResults(plantsPages.placeOfDestination.resultsHeading, address.name);
    await expect(plantsPages.placeOfDestination.currentAddress).toContainText(address.name);

    await plantsPages.placeOfDestination.search(address.name);
    await expect(plantsPages.placeOfDestination.address(address.name)).toBeChecked();

    await plantsPages.placeOfDestination.editCurrentAddress.click();
    await plantsPages.placeOfDestinationEdit.fill({ name: editedName });
    await plantsPages.placeOfDestinationEdit.saveChanges.click();

    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrlPattern(reference));
    await expect(plantsPages.placeOfDestination.currentAddress).toContainText(editedName);
    await expect(plantsPages.placeOfDestination.checkedAddress).toHaveCount(0);

    await plantsPages.placeOfDestination.open(reference);
    await expect(plantsPages.placeOfDestination.checkedAddress).toHaveCount(0);
  });

  test('place of destination: a record with two street lines and a county shows each street line on its own line, then its town, county and postcode on one line, and its "View details" disclosure opens in place and holds exactly that record\'s telephone number and email address', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const record = await addressBookApi.createAddress({
      ...addressWithLineTwoAndCounty(`Picker County Nursery ${randomUUID()}`),
      ...heldAsPlaceOfDestination,
    });
    await plantsJourney.toDestinationOfNewNotification(PLANTS_FOR_PLANTING);

    await plantsPages.placeOfDestination.search(record.name);

    await expect.poll(() => pickerAddressCellText(pages.page, record.name)).toBe(expectedPickerAddressCellText(record));

    const urlBeforeOpening = pages.page.url();
    await plantsPages.placeOfDestination.addressDetailsToggle(record.name).click();

    expect(pages.page.url()).toBe(urlBeforeOpening);
    await expect(plantsPages.placeOfDestination.addressDetailsLines(record.name)).toHaveText([record.phone, record.email]);
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

test.describe('Addresses picker country search', { tag: '@address-book' }, () => {
  test('a consignor list searched for France lists the consignors in France', async ({ plantsPages, plantsJourney, addressBookApi }) => {
    await plantsJourney.toConsignorOfNewNotification(addressBookApi, PLANTS_FOR_PLANTING);

    await saveAddressThenExpectCountrySearchListsIt(
      addressBookApi,
      plantsPages.consignorSelect,
      { ...frenchConsignorFixture, name: `Laiterie du Nord ${randomUUID()}` },
      { term: 'France', countryCode: 'FR', countryLabel: 'France', role: addressRoles.consignor },
    );
  });

  test('a place of destination list searched for United Kingdom lists the places of destination in the United Kingdom', async ({
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    await plantsJourney.toDestinationOfNewNotification(PLANTS_FOR_PLANTING);

    await saveAddressThenExpectCountrySearchListsIt(
      addressBookApi,
      plantsPages.placeOfDestination,
      nurseryAddress(`Country Search Nursery ${randomUUID()}`),
      { term: 'United Kingdom', countryCode: 'GB', countryLabel: 'United Kingdom', role: addressRoles.placeOfDestination },
    );
  });
});

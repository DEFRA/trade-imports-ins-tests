import { test, expect } from '@fixtures';
import { addressRoles, heldAsConsignee, heldAsConsignor } from '@domain/shared/constants/address-types';
import { addressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';
import { consignorFixture } from '@flows/shared/address-book-seed';
import {
  expectedPickerAddressCellText,
  expectNothingBetweenSearchAndResults,
  WHOLE_LIST_COUNT,
} from '@page-objects/shared/address-picker-results';

test.describe('Addresses picker', { tag: ['@duplicated-in-frontend', '@address-book'] }, () => {
  test('lists only addresses saved for the role; a record saved for two roles is listed on both', async ({
    animalsJourney,
    animalsPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const consigneeOnlyName = `Consignee Only Farm ${stamp}`;
    await addressBookApi.createAddress({
      ...heldAsConsignee,
      name: consigneeOnlyName,
      addressLine1: '1 Consignee Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 1AA',
      countryCode: 'GB',
      phone: '01228 555 0196',
      email: 'consignee-only@example.co.uk',
    });
    const consigneeAndImporterName = `Consignee And Importer Farm ${stamp}`;
    await addressBookApi.createAddress({
      roles: [addressRoles.consignee, addressRoles.importer],
      name: consigneeAndImporterName,
      addressLine1: '2 Shared Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 1BB',
      countryCode: 'GB',
      phone: '01228 555 0195',
      email: 'shared-role@example.co.uk',
    });

    await animalsJourney.toPartyPicker('Consignee');
    await expect(animalsPages.consigneeSelection.party(consigneeOnlyName)).toBeVisible();
    await expect(animalsPages.consigneeSelection.party(consigneeAndImporterName)).toBeVisible();

    await animalsJourney.toPartyPicker('Importer');
    await expect(animalsPages.importerSelection.party(consigneeAndImporterName)).toBeVisible();
    await expect(animalsPages.importerSelection.party(consigneeOnlyName)).toHaveCount(0);
  });

  test('the picker searches within the role, lists every match on one page, and the row ticked is the one that saves, shown checked on reopening with nothing between the search box and the results heading', async ({
    animalsJourney,
    animalsPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const runOnlySearchToken = `Kolding${stamp}`;
    const searchMatches = [`Danish Meat Export ${runOnlySearchToken}`, `Jutland Swine ${runOnlySearchToken}`];
    for (const name of searchMatches) {
      await addressBookApi.createAddress({
        ...heldAsConsignor,
        name,
        addressLine1: 'Havnegade 21',
        townOrCity: 'Copenhagen',
        postcode: '1058',
        countryCode: 'DK',
        phone: '01228 555 0197',
        email: 'searchable@example.co.uk',
      });
    }
    const consigneeRoleSearchMatch = `Consignee Match ${runOnlySearchToken}`;
    await addressBookApi.createAddress({
      ...heldAsConsignee,
      name: consigneeRoleSearchMatch,
      addressLine1: '10 Market Street',
      townOrCity: 'Leeds',
      postcode: 'LS1 6HB',
      countryCode: 'GB',
      phone: '01228 555 0198',
      email: 'searchable-consignee@example.co.uk',
    });

    const chosenName = `Chosen Consignor ${stamp}`;
    const chosenRecord = {
      name: chosenName,
      addressLine1: '1 Chosen Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 1AA',
    };
    const chosenAddressText = AnimalsAddressesPage.expectedAddressText({ ...chosenRecord, country: 'United Kingdom' });
    await addressBookApi.createAddress({
      ...chosenRecord,
      ...heldAsConsignor,
      countryCode: 'GB',
      phone: '01228 555 0199',
      email: 'chosen@example.co.uk',
    });

    await animalsJourney.toPartyPicker('Consignor');

    const consignorAddressLines = animalsPages.addresses.partyAddressLines('Consignor');

    await expect(animalsPages.consignorSelection.resultsHeading).toBeVisible();
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText(WHOLE_LIST_COUNT);

    await animalsPages.consignorSelection.search(runOnlySearchToken);
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText('Showing 2 out of 2 results');
    await expect(animalsPages.consignorSelection.party(searchMatches[0])).toBeVisible();
    await expect(animalsPages.consignorSelection.party(searchMatches[1])).toBeVisible();
    await expect(animalsPages.consignorSelection.party(consigneeRoleSearchMatch)).toHaveCount(0);

    await animalsPages.consignorSelection.search(chosenName);
    await animalsPages.consignorSelection.party(chosenName).check();
    await animalsPages.consignorSelection.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(consignorAddressLines).toHaveText(chosenAddressText, { useInnerText: true });

    await animalsPages.addresses.changeParty('Consignor').click();
    await expect(animalsPages.consignorSelection.heading).toBeVisible();
    await expect(animalsPages.consignorSelection.party(chosenName)).toBeChecked();
    await expectNothingBetweenSearchAndResults(animalsPages.consignorSelection.resultsHeading);
    await animalsPages.consignorSelection.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(consignorAddressLines).toHaveText(chosenAddressText, { useInnerText: true });
  });

  test('a picker row shows the street line, then town and postcode on one line, and ends with only a View link', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toPartyPicker('Consignor');

    await animalsPages.consignorSelection.search(consignorFixture.name);
    await expect
      .poll(() => animalsPages.consignorSelection.partyAddressCellText(consignorFixture.name))
      .toBe(expectedPickerAddressCellText(consignorFixture));
    await expect(animalsPages.consignorSelection.partyActionCell(consignorFixture.name)).toHaveText(`View ${consignorFixture.name}`);
  });

  test('a picker row with a second street line and a county shows each street line on its own line, then town, county and postcode on one line', async ({
    animalsJourney,
    animalsPages,
    addressBookApi,
  }) => {
    const record = { ...addressWithLineTwoAndCounty(`Picker County Farm ${Date.now()}`), ...heldAsConsignor };
    await addressBookApi.createAddress(record);
    await animalsJourney.toPartyPicker('Consignor');

    await animalsPages.consignorSelection.search(record.name);

    await expect.poll(() => animalsPages.consignorSelection.partyAddressCellText(record.name)).toBe(expectedPickerAddressCellText(record));
  });

  test('saving with nothing ticked returns to the consignment addresses page with the consignor section offering only its add link', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toPartyPicker('Consignor');

    await animalsPages.consignorSelection.saveAndContinue.click();

    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(animalsPages.addresses.partyLinks('Consignor')).toHaveText([AnimalsAddressesPage.addLinkName('Consignor')]);
  });
});

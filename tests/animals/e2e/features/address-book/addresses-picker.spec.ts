import { test, expect } from '@fixtures';
import { heldAsConsignor } from '@domain/shared/constants/address-types';
import { addressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';
import { AnimalsPartyPickerPage } from '@page-objects/animals/party-picker-page';
import { destinationFixture } from '@flows/shared/address-book-seed';

const FIVE_RESULTS_SUMMARY = /^Showing 5 out of \d+ results$/;

test.describe('Addresses picker', { tag: ['@duplicated-in-frontend', '@address-book'] }, () => {
  test('the picker searches and pages the address book, and the row selected on a later page is the one that saves', async ({
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

    const olderThanPageOneName = `Paged Consignor ${stamp}`;
    const olderThanPageOneRecord = {
      name: olderThanPageOneName,
      addressLine1: '1 Later Page Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 1AA',
    };
    const olderThanPageOneAddressText = AnimalsAddressesPage.expectedAddressText({ ...olderThanPageOneRecord, country: 'United Kingdom' });
    await addressBookApi.createAddress({
      ...olderThanPageOneRecord,
      ...heldAsConsignor,
      countryCode: 'GB',
      phone: '01228 555 0199',
      email: 'paged@example.co.uk',
    });
    for (let i = 0; i < 5; i += 1) {
      await addressBookApi.createAddress({
        ...heldAsConsignor,
        name: `Page One Filler ${stamp} ${i}`,
        addressLine1: `${i} Front Row`,
        townOrCity: 'Carlisle',
        postcode: 'CA1 1BB',
        countryCode: 'GB',
        phone: '01228 555 0198',
        email: 'newer@example.co.uk',
      });
    }

    await animalsJourney.toPartyPicker('Consignor');

    const consignorAddressLines = animalsPages.addresses.partyAddressLines('Consignor');

    await expect(animalsPages.consignorSelection.resultsHeading).toBeVisible();
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText(FIVE_RESULTS_SUMMARY);
    await expect(animalsPages.consignorSelection.resultsGroup.getByRole('radio')).toHaveCount(5);

    await animalsPages.consignorSelection.search(runOnlySearchToken);
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText('Showing 2 out of 2 results');
    await expect(animalsPages.consignorSelection.party(searchMatches[1])).toBeVisible();
    await expect(animalsPages.consignorSelection.paginationPageLink(2)).toHaveCount(0);

    await animalsPages.consignorSelection.search('');
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText(FIVE_RESULTS_SUMMARY);

    const olderThanPageOne = animalsPages.consignorSelection.party(olderThanPageOneName);
    await expect(olderThanPageOne).toHaveCount(0);
    await animalsPages.consignorSelection.followNextPageUntilShown(olderThanPageOne);
    await expect(olderThanPageOne).toBeVisible();

    await animalsPages.consignorSelection.party(olderThanPageOneName).check();
    await animalsPages.consignorSelection.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(consignorAddressLines).toHaveText(olderThanPageOneAddressText, { useInnerText: true });

    await animalsPages.addresses.changeParty('Consignor').click();
    await expect(animalsPages.consignorSelection.heading).toBeVisible();
    await expect(animalsPages.consignorSelection.selectedAddress).toHaveText(`Selected address: ${olderThanPageOneName}`);
    await expect(animalsPages.consignorSelection.party(olderThanPageOneName)).toHaveCount(0);
    await animalsPages.consignorSelection.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(consignorAddressLines).toHaveText(olderThanPageOneAddressText, { useInnerText: true });
  });

  test('a picker row shows the street line, then town and postcode on one line, and ends with only a View link', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toPartyPicker('Consignor');

    await animalsPages.consignorSelection.search(destinationFixture.name);
    await expect(animalsPages.consignorSelection.partyAddressCell(destinationFixture.name)).toHaveText(
      AnimalsPartyPickerPage.expectedAddressCellText(destinationFixture),
      { useInnerText: true },
    );
    await expect(animalsPages.consignorSelection.partyActionCell(destinationFixture.name)).toHaveText(`View ${destinationFixture.name}`);
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

    await expect(animalsPages.consignorSelection.partyAddressCell(record.name)).toHaveText(
      AnimalsPartyPickerPage.expectedAddressCellText(record),
      { useInnerText: true },
    );
  });

  test('saving with nothing ticked returns to the roles and addresses page with the consignor section offering only its add link', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toPartyPicker('Consignor');

    await animalsPages.consignorSelection.saveAndContinue.click();

    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(animalsPages.addresses.partyLinks('Consignor')).toHaveText([AnimalsAddressesPage.addLinkName('Consignor')]);
  });
});

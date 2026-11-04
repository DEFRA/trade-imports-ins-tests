import { test, expect } from '@fixtures';
import { heldAsConsignor } from '@domain/shared/constants/address-types';
import { DESTINATION_NAME } from '@domain/shared/constants/journey-party-names';
import { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';

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

    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    await animalsPages.overview.task('Roles and addresses').click();
    const consignorAddressLines = animalsPages.addresses.partyAddressLines('Consignor');
    await animalsPages.addresses.addParty('Consignor').click();

    await expect(animalsPages.consignorSelection.resultsHeading).toBeVisible();
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText(FIVE_RESULTS_SUMMARY);
    await expect(animalsPages.consignorSelection.resultsGroup.getByRole('radio')).toHaveCount(5);

    await animalsPages.consignorSelection.searchBox.fill(DESTINATION_NAME);
    await animalsPages.consignorSelection.searchButton.click();
    const detailLines = animalsPages.consignorSelection.partyDetailsLines(DESTINATION_NAME);
    await expect(detailLines).toHaveCount(0);
    await animalsPages.consignorSelection.openPartyDetails(DESTINATION_NAME);
    await expect(detailLines.filter({ hasText: 'London' })).toBeVisible();

    await animalsPages.consignorSelection.searchBox.fill(runOnlySearchToken);
    await animalsPages.consignorSelection.searchButton.click();
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText('Showing 2 out of 2 results');
    await expect(animalsPages.consignorSelection.party(searchMatches[1])).toBeVisible();
    await expect(animalsPages.consignorSelection.paginationPageLink(2)).toHaveCount(0);

    await animalsPages.consignorSelection.searchBox.fill('');
    await animalsPages.consignorSelection.searchButton.click();
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText(FIVE_RESULTS_SUMMARY);

    const olderThanPageOne = animalsPages.consignorSelection.party(olderThanPageOneName);
    await expect(olderThanPageOne).toHaveCount(0);
    await animalsPages.consignorSelection.followNextUntilListed(olderThanPageOneName);
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

  test('saving with nothing ticked returns to the roles and addresses page with the consignor section offering only its add link', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();
    await animalsPages.overview.task('Roles and addresses').click();
    await animalsPages.addresses.addParty('Consignor').click();

    await animalsPages.consignorSelection.saveAndContinue.click();

    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(animalsPages.addresses.partyLinks('Consignor')).toHaveText([AnimalsAddressesPage.addLinkName('Consignor')]);
  });
});

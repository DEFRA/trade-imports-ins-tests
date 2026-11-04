import { test, expect } from '@fixtures';
import { heldAsConsignor } from '@domain/shared/constants/address-types';
import { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';

const FIVE_RESULTS_SUMMARY = /^Showing 5 out of \d+ results$/;

test.describe('Addresses picker', { tag: ['@duplicated-in-frontend', '@address-book'] }, () => {
  test('the picker searches and pages the address book, and the row selected on a later page is the one that saves', async ({
    animalsJourney,
    pages,
    animalsPages,
    addressBookApi,
  }) => {
    const page = pages.page;
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

    await animalsPages.consignorSelection.searchBox.fill('Tech Imports Ltd');
    await animalsPages.consignorSelection.searchButton.click();
    const detailedRow = page.locator('tr', { hasText: 'Tech Imports Ltd' });
    const rowDetails = detailedRow.locator('details');
    await expect(rowDetails.locator('.govuk-details__text')).toBeHidden();
    await rowDetails.locator('summary').click();
    await expect(rowDetails.locator('.govuk-details__text')).toBeVisible();
    await expect(rowDetails).toContainText('London');

    await animalsPages.consignorSelection.searchBox.fill(runOnlySearchToken);
    await animalsPages.consignorSelection.searchButton.click();
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText('Showing 2 out of 2 results');
    await expect(animalsPages.consignorSelection.party(searchMatches[1])).toBeVisible();
    await expect(page.getByRole('link', { name: 'Page 2' })).toHaveCount(0);

    await animalsPages.consignorSelection.searchBox.fill('');
    await animalsPages.consignorSelection.searchButton.click();
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText(FIVE_RESULTS_SUMMARY);

    await expect(animalsPages.consignorSelection.party(olderThanPageOneName)).toHaveCount(0);
    const olderThanPageOne = animalsPages.consignorSelection.party(olderThanPageOneName);
    const nextLink = page.getByRole('link', { name: /Next/ });
    const currentPageNumber = page.locator('[aria-current="page"]');
    for (let landedOn = 1; (await olderThanPageOne.count()) === 0; landedOn += 1) {
      if ((await nextLink.count()) === 0) {
        break;
      }
      await nextLink.click();
      await expect(currentPageNumber).toHaveText(String(landedOn + 1));
    }
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

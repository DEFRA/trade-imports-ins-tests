import { test, expect } from '@fixtures';

test.describe('Addresses picker', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the picker searches and pages the address book, the row selected on a later page is the one that saves, and reopening starts with nothing chosen but keeps the copy on save', async ({
    animalsJourney,
    pages,
    animalsPages,
    addressBookApi,
  }) => {
    const page = pages.page;
    // Own records for every leg that counts rows: the address book is shared and
    // never wiped, so a search has to be scoped to a token only this run minted.
    const stamp = Date.now();
    const searchToken = `Kolding${stamp}`;
    const searchMatches = [`Danish Meat Export ${searchToken}`, `Jutland Swine ${searchToken}`];
    for (const name of searchMatches) {
      await addressBookApi.createAddress({
        name,
        addressLine1: 'Havnegade 21',
        townOrCity: 'Copenhagen',
        postcode: '1058',
        countryCode: 'DK',
        phone: '01228 555 0197',
        email: 'searchable@example.co.uk',
      });
    }

    // Pagination leg: create the target first, then five newer ones so
    // newest-first listing pushes the target off page one.
    const targetName = `Paged Consignor ${stamp}`;
    await addressBookApi.createAddress({
      name: targetName,
      addressLine1: '1 Later Page Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 1AA',
      countryCode: 'GB',
      phone: '01228 555 0199',
      email: 'paged@example.co.uk',
    });
    for (let i = 0; i < 5; i += 1) {
      await addressBookApi.createAddress({
        name: `Newer Than Target ${stamp} ${i}`,
        addressLine1: `${i} Front Row`,
        townOrCity: 'Carlisle',
        postcode: 'CA1 1BB',
        countryCode: 'GB',
        phone: '01228 555 0198',
        email: 'newer@example.co.uk',
      });
    }

    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    await animalsPages.overview.task('Roles and addresses').click();
    const consignorRow = animalsPages.addresses.partyRow('Consignor or exporter');
    await animalsPages.addresses.addParty('Consignor or exporter').click();

    const showingFive = /Showing 5 of \d+ addresses/;
    await expect(page.getByText(showingFive)).toBeVisible();

    // View details expands the row in place (no navigation, so nothing typed or
    // ticked is lost) and shows the rest of the record.
    await animalsPages.consignorSelection.search.fill('Tech Imports Ltd');
    await animalsPages.consignorSelection.searchButton.click();
    const detailedRow = page.locator('tr', { hasText: 'Tech Imports Ltd' });
    const rowDetails = detailedRow.locator('details');
    await expect(rowDetails.locator('.govuk-details__text')).toBeHidden();
    await rowDetails.locator('summary').click();
    await expect(rowDetails.locator('.govuk-details__text')).toBeVisible();
    await expect(rowDetails).toContainText('London');

    // Search is a server round-trip over the whole book and narrows it to a
    // single page of results. Searching this run's own token keeps the count
    // exact however many records earlier runs left behind.
    await animalsPages.consignorSelection.search.fill(searchToken);
    await animalsPages.consignorSelection.searchButton.click();
    await expect(page.getByText('Showing 2 of 2 addresses')).toBeVisible();
    await expect(animalsPages.consignorSelection.party(searchMatches[1])).toBeVisible();
    await expect(page.getByRole('link', { name: 'Page 2' })).toHaveCount(0);

    // Clearing the search restores the whole book and its pagination.
    await animalsPages.consignorSelection.search.fill('');
    await animalsPages.consignorSelection.searchButton.click();
    await expect(page.getByText(showingFive)).toBeVisible();

    // Target was pushed off page one by the five newer creates — step Next
    // until it appears, then select it (cross-page selection without JS).
    await expect(animalsPages.consignorSelection.party(targetName)).toHaveCount(0);
    const target = animalsPages.consignorSelection.party(targetName);
    const nextLink = page.getByRole('link', { name: /Next/ });
    const currentPageNumber = page.locator('[aria-current="page"]');
    // Other workers add to the shared book mid-walk, so follow Next until it runs out
    // rather than to a last page computed before the walk started.
    for (let landedOn = 1; (await target.count()) === 0; landedOn += 1) {
      if ((await nextLink.count()) === 0) {
        break;
      }
      await nextLink.click();
      await expect(currentPageNumber).toHaveText(String(landedOn + 1));
    }
    await expect(target).toBeVisible();

    await animalsPages.consignorSelection.party(targetName).check();
    await animalsPages.consignorSelection.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText(targetName);

    // The notification holds a copy with no link to the record, so reopening the
    // list starts afresh: nothing chosen and nothing named as selected. Saving
    // without choosing keeps the copy rather than demanding a fresh pick.
    await animalsPages.addresses.changeParty('Consignor or exporter').click();
    await expect(animalsPages.consignorSelection.heading).toBeVisible();
    await expect(animalsPages.consignorSelection.chosenParty).toHaveCount(0);
    await expect(animalsPages.consignorSelection.selectedAddress).toHaveCount(0);
    await animalsPages.consignorSelection.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText(targetName);
  });
});

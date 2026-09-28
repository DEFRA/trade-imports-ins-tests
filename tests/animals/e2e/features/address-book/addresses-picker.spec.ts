import { test, expect } from '@fixtures';

test.describe('Addresses picker', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the picker searches and pages the address book, and the row selected on a later page is the one that saves', async ({
    journey,
    pages,
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
      countryCode: 'United Kingdom',
      phone: '01228 555 0199',
      email: 'paged@example.co.uk',
    });
    for (let i = 0; i < 5; i += 1) {
      await addressBookApi.createAddress({
        name: `Newer Than Target ${stamp} ${i}`,
        addressLine1: `${i} Front Row`,
        townOrCity: 'Carlisle',
        postcode: 'CA1 1BB',
        countryCode: 'United Kingdom',
        phone: '01228 555 0198',
        email: 'newer@example.co.uk',
      });
    }

    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    const consignorRow = pages.addresses.partyRow('Consignor or exporter');
    await pages.addresses.addParty('Consignor or exporter').click();

    const showingFive = /Showing 5 of \d+ addresses/;
    await expect(page.getByText(showingFive)).toBeVisible();

    // View details expands the row in place (no navigation, so nothing typed or
    // ticked is lost) and shows the rest of the record.
    await pages.consignorSelection.search.fill('Tech Imports Ltd');
    await pages.consignorSelection.searchButton.click();
    const detailedRow = page.locator('tr', { hasText: 'Tech Imports Ltd' });
    const rowDetails = detailedRow.locator('details');
    await expect(rowDetails.locator('.govuk-details__text')).toBeHidden();
    await rowDetails.locator('summary').click();
    await expect(rowDetails.locator('.govuk-details__text')).toBeVisible();
    await expect(rowDetails).toContainText('London');

    // Search is a server round-trip over the whole book and narrows it to a
    // single page of results. Searching this run's own token keeps the count
    // exact however many records earlier runs left behind.
    await pages.consignorSelection.search.fill(searchToken);
    await pages.consignorSelection.searchButton.click();
    await expect(page.getByText('Showing 2 of 2 addresses')).toBeVisible();
    await expect(pages.consignorSelection.party(searchMatches[1])).toBeVisible();
    await expect(page.getByRole('link', { name: 'Page 2' })).toHaveCount(0);

    // Clearing the search restores the whole book and its pagination.
    await pages.consignorSelection.search.fill('');
    await pages.consignorSelection.searchButton.click();
    await expect(page.getByText(showingFive)).toBeVisible();

    // Target was pushed off page one by the five newer creates — step Next
    // until it appears, then select it (cross-page selection without JS).
    await expect(pages.consignorSelection.party(targetName)).toHaveCount(0);
    const target = pages.consignorSelection.party(targetName);
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

    await pages.consignorSelection.party(targetName).check();
    await pages.consignorSelection.saveAndContinue.click();
    await expect(pages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText(targetName);

    // Re-entering opens on page one, where the chosen record is not rendered —
    // the picker still knows it (carried, not re-ticked), and a save from this
    // page keeps it. That is the no-JS selection-across-pagination guarantee.
    await consignorRow.getByRole('link', { name: 'Change' }).click();
    await expect(page.getByText(`Selected address: ${targetName}`)).toBeVisible();
    await expect(pages.consignorSelection.party(targetName)).toHaveCount(0);
    await pages.consignorSelection.saveAndContinue.click();
    await expect(pages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText(targetName);
  });
});

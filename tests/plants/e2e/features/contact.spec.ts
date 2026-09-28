import type { AddressBookRecord } from '@adapters/http/address-book-api-client';
import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import type { PageObjects } from '@page-objects';
import type { PlantsJourney } from '@flows/plants-journey';

const CONTACT = 'Contact address for consignment';

// The picker shows five rows a page (design 05-03..06), whatever page size the
// address-book API itself serves.
const PICKER_PAGE_SIZE = 5;

/** A record only this run can find: the address book is shared across workers
 * and never wiped, so anything that counts rows has to search its own token. */
const addressNamed = (name: string) => ({
  name,
  addressLine1: '4 Nursery Lane',
  townOrCity: 'Perth',
  postcode: 'PH1 5EX',
  countryCode: 'GB',
  phone: '01738 555 0143',
  email: 'contact@example.co.uk',
});

async function openContact(pages: PageObjects, journey: PlantsJourney): Promise<string> {
  const reference = await journey.startNotification();
  await journey.chooseCommodityType('Potatoes (seed or ware)');
  await journey.addCommodityLine('Seed potatoes', { Variety: 'Maris Piper', Quantity: '250', 'Intended use': 'Planting' });
  await journey.toOrigin();
  await journey.toArrivalDetails('France');
  await pages.plantsOverview.open(reference);
  await pages.plantsOverview.taskRow(CONTACT).getByRole('link', { name: CONTACT, exact: true }).click();
  return reference;
}

test.describe('High-risk plants contact', { tag: '@integration' }, () => {
  test('searches the address book, pages the matches five at a time and persists a row ticked on a later page', async ({
    pages,
    plantsJourney,
    addressBookApi,
  }) => {
    const token = randomUUID();
    const records: AddressBookRecord[] = [];
    // The book lists newest first, so the five newer records fill page one of
    // the search and push the first one minted onto page two.
    for (let index = 0; index <= PICKER_PAGE_SIZE; index++) {
      records.push(await addressBookApi.createAddress(addressNamed(`Contact ${token} ${index}`)));
    }
    const target = records[0];

    const reference = await openContact(pages, plantsJourney);
    const contact = pages.plantsConsignmentContactSelect;
    await expect(pages.page).toHaveURL(contact.expectedUrl(reference));
    await expect(contact.heading).toBeVisible();

    await contact.searchFor(token);
    await expect(contact.resultsCaption).toHaveText('Showing 5 of 6 addresses');
    await expect(contact.address(target.name)).toHaveCount(0);

    // Paging is a link, not a submit, and it carries the search term with it.
    await contact.pageLink(2).click();
    await expect(contact.resultsCaption).toHaveText('Showing 1 of 6 addresses');

    await contact.address(target.name).check();
    await contact.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
    await expect(pages.plantsOverview.taskRow(CONTACT)).toContainText('Completed');
    // Contact ends its own section; review is entered from Overview once every task is complete.
    const review = pages.page.getByRole('listitem').filter({ hasText: 'Check and submit' });
    await expect(review).toContainText('Cannot start yet');
    await expect(review.getByRole('link')).toHaveCount(0);

    // Re-entering opens on page one of the whole book, where the chosen record
    // is not rendered — the picker still knows it, and says so in the inset.
    await contact.open(reference);
    await expect(contact.selectedAddress(target.name)).toBeVisible();
    await expect(contact.address(target.name)).toHaveCount(0);
  });

  test('continues through declaration to confirmation after checking Back navigation', async ({ pages, plantsJourney, addressBookApi }) => {
    const address = await addressBookApi.createAddress(addressNamed(`Review ${randomUUID()}`));
    const reference = await openContact(pages, plantsJourney);
    await pages.plantsConsignmentContactSelect.searchFor(address.name);
    await pages.plantsConsignmentContactSelect.address(address.name).check();
    await pages.plantsConsignmentContactSelect.btnSaveAndContinue.click();
    await pages.plantsArrivalDetails.open(reference);
    await pages.plantsArrivalDetails.dateQuestionLabelled('Expected date of arrival').fill('27/3/2027');
    await pages.plantsArrivalDetails.arrivalTime.fill('14:30');
    await pages.plantsArrivalDetails.selectPlaceOfLanding('Aberdeen Harbour (GB ABD)');
    await pages.plantsArrivalDetails.btnSaveAndContinue.click();
    await pages.plantsPlaceOfDestination.open(reference);
    await pages.plantsPlaceOfDestination.searchFor(address.name);
    await pages.plantsPlaceOfDestination.address(address.name).check();
    await pages.plantsPlaceOfDestination.btnSaveAndContinue.click();
    await pages.plantsIdentificationNumbers.open(reference);
    await pages.plantsIdentificationNumbers.producer.fill('P123');
    await pages.plantsIdentificationNumbers.crop.fill('C123');
    await pages.plantsIdentificationNumbers.btnSaveAndContinue.click();
    await pages.plantsOverview.open(reference);
    await pages.page.getByRole('link', { name: 'Check and submit', exact: true }).click();
    await expect(pages.page).toHaveURL(pages.plantsNotificationView.expectedUrl(reference));
    await pages.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(pages.page).toHaveURL(pages.plantsDeclaration.expectedUrl(reference));
    await expect(pages.page.getByRole('heading', { name: 'Declaration', level: 1 })).toBeVisible();
    await pages.page.getByRole('link', { name: 'Back', exact: true }).click();
    await expect(pages.page).toHaveURL(pages.plantsNotificationView.expectedUrl(reference));
    await pages.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await pages.page
      .getByRole('checkbox', {
        name: 'I confirm that I have reviewed and comply with this declaration and that the information submitted in this notification is true and correct.',
      })
      .check();
    await pages.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(pages.page).toHaveURL(pages.plantsConfirmation.expectedUrl(reference));
    await expect(pages.page.getByRole('heading', { name: 'Notification submitted', level: 1 })).toBeVisible();
    await expect(pages.page.getByText('Your notification reference', { exact: false })).toContainText(reference);
  });

  for (const action of ['continue', 'return'] as const) {
    test(`blank contact permits save and ${action} and leaves the row incomplete`, async ({ pages, plantsJourney }) => {
      const reference = await openContact(pages, plantsJourney);
      const contact = pages.plantsConsignmentContactSelect;
      const button = action === 'continue' ? contact.btnSaveAndContinue : contact.btnSaveAndReturn;
      await button.click();
      await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
      // The inherited status model has no visited-page state: a blank save remains Not yet started.
      await expect(pages.plantsOverview.taskRow(CONTACT)).toContainText('Not yet started');
      await contact.open(reference);
      await expect(contact.heading).toBeVisible();
      await expect(contact.selectedAddressInset).toHaveCount(0);
      await expect(pages.page.getByRole('radio', { checked: true })).toHaveCount(0);
    });
  }
});

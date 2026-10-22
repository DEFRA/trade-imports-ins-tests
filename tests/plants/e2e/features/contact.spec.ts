import type { AddressBookRecord } from '@adapters/http/address-book-api-client';
import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { portByCode } from '@resources/reference-data/reference-data';
import type { PlantsPages } from '@page-objects';
import { nurseryAddress, type PlantsJourney } from '@flows/plants/journey';

const CONTACT = 'Contact address for consignment';

const PICKER_PAGE_SIZE = 5;

async function openContact(plantsPages: PlantsPages, journey: PlantsJourney): Promise<string> {
  const reference = await journey.toArrivalDetailsOfNewPotatoNotification();
  await plantsPages.overview.open(reference);
  await plantsPages.overview.taskRow(CONTACT).getByRole('link', { name: CONTACT, exact: true }).click();
  return reference;
}

test.describe('High-risk plants contact', () => {
  test(
    'searches the address book, pages the matches five at a time and persists a row ticked on a later page',
    { tag: '@address-book' },
    async ({ pages, plantsPages, plantsJourney, addressBookApi }) => {
      const token = randomUUID();
      const records: AddressBookRecord[] = [];
      for (let index = 0; index <= PICKER_PAGE_SIZE; index++) {
        records.push(await addressBookApi.createAddress(nurseryAddress(`Contact ${token} ${index}`)));
      }
      const target = records[0];

      const reference = await openContact(plantsPages, plantsJourney);
      const contact = plantsPages.consignmentContactSelect;
      await expect(pages.page).toHaveURL(contact.expectedUrl(reference));
      await expect(contact.heading).toBeVisible();

      await contact.searchFor(token);
      await expect(contact.resultsSummary).toHaveText('Showing 5 out of 6 results');
      await expect(contact.address(target.name)).toHaveCount(0);

      await contact.pageLink(2).click();
      await expect(contact.resultsSummary).toHaveText('Showing 1 out of 6 results');

      await contact.address(target.name).check();
      await contact.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
      await expect(plantsPages.overview.taskRow(CONTACT)).toContainText('Completed');
      const review = pages.page.getByRole('listitem').filter({ hasText: 'Check and submit' });
      await expect(review).toContainText('Cannot start yet');
      await expect(review.getByRole('link')).toHaveCount(0);

      await contact.open(reference);
      await expect(contact.selectedAddress(target.name)).toBeVisible();
      await expect(contact.address(target.name)).toHaveCount(0);
    },
  );

  test('continues through declaration to confirmation after checking Back navigation', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const address = await addressBookApi.createAddress(nurseryAddress(`Review ${randomUUID()}`));
    const reference = await openContact(plantsPages, plantsJourney);
    await plantsPages.consignmentContactSelect.searchFor(address.name);
    await plantsPages.consignmentContactSelect.address(address.name).check();
    await plantsPages.consignmentContactSelect.btnSaveAndContinue.click();
    await plantsPages.arrivalDetails.open(reference);
    await plantsPages.arrivalDetails.dateQuestionLabelled('Expected date of arrival').fill('27/3/2027');
    await plantsPages.arrivalDetails.arrivalTime.fill('14:30');
    await plantsPages.arrivalDetails.placeOfLanding.choose(portByCode('GB ABD').display);
    await plantsPages.arrivalDetails.btnSaveAndContinue.click();
    await plantsPages.placeOfDestination.open(reference);
    await plantsPages.placeOfDestination.searchFor(address.name);
    await plantsPages.placeOfDestination.address(address.name).check();
    await plantsPages.placeOfDestination.btnSaveAndContinue.click();
    await plantsPages.identificationNumbers.open(reference);
    await plantsPages.identificationNumbers.producer.fill('P123');
    await plantsPages.identificationNumbers.crop.fill('C123');
    await plantsPages.identificationNumbers.btnSaveAndContinue.click();
    await plantsPages.overview.open(reference);
    await pages.page.getByRole('link', { name: 'Check and submit', exact: true }).click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await pages.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(pages.page).toHaveURL(plantsPages.declaration.expectedUrl(reference));
    await expect(pages.page.getByRole('heading', { name: 'Declaration', level: 1 })).toBeVisible();
    await pages.page.getByRole('link', { name: 'Back', exact: true }).click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await pages.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await pages.page
      .getByRole('checkbox', {
        name: 'I confirm that I have reviewed and comply with this declaration and that the information submitted in this notification is true and correct.',
      })
      .check();
    await pages.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(pages.page).toHaveURL(plantsPages.confirmation.expectedUrl(reference));
    await expect(pages.page.getByRole('heading', { name: 'Notification submitted', level: 1 })).toBeVisible();
    await expect(pages.page.getByText('Your notification reference', { exact: false })).toContainText(reference);
  });

  for (const action of ['continue', 'return'] as const) {
    test(`blank contact permits save and ${action} and leaves the row incomplete`, async ({ pages, plantsPages, plantsJourney }) => {
      const reference = await openContact(plantsPages, plantsJourney);
      const contact = plantsPages.consignmentContactSelect;
      const button = action === 'continue' ? contact.btnSaveAndContinue : contact.saveAndReturnToOverview;
      await button.click();
      await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
      await expect(plantsPages.overview.taskRow(CONTACT)).toContainText('Not yet started');
      await contact.open(reference);
      await expect(contact.heading).toBeVisible();
      await expect(contact.selectedAddressInset).toHaveCount(0);
      await expect(pages.page.getByRole('radio', { checked: true })).toHaveCount(0);
    });
  }
});

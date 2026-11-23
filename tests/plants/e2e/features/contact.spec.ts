import type { AddressBookRecord } from '@adapters/http/address-book-api-client';
import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { portByCode } from '@resources/reference-data/reference-data';
import type { PlantsPages } from '@page-objects';
import { nurseryAddress, type PlantsJourney } from '@flows/plants/journey';
import { expectChosenAddressNamedAboveResults } from '@page-objects/shared/address-picker-results';
import { expectSaveControlsLayout } from '@page-objects/shared/journey-checks';

const CONTACT = 'Contact address for consignment';
const MATCHING_RECORDS = 6;

async function openContact(plantsPages: PlantsPages, journey: PlantsJourney): Promise<string> {
  const reference = await journey.toArrivalDetailsOfNewPotatoNotification();
  await plantsPages.overview.open(reference);
  await plantsPages.overview.taskRow(CONTACT).getByRole('link', { name: CONTACT, exact: true }).click();
  return reference;
}

test.describe('High-risk plants contact', () => {
  test(
    'searches the address book, lists every match of a search that fits on one page, and persists a row ticked, named above the results on reopening and checked once its page is shown',
    { tag: '@address-book' },
    async ({ pages, plantsPages, plantsJourney, addressBookApi }) => {
      const token = randomUUID();
      const records: AddressBookRecord[] = [];
      for (let index = 0; index < MATCHING_RECORDS; index += 1) {
        records.push(await addressBookApi.createAddress(nurseryAddress(`Contact ${token} ${index}`)));
      }
      const target = records[0];

      const reference = await openContact(plantsPages, plantsJourney);
      const contact = plantsPages.consignmentContactSelect;
      await expect(pages.page).toHaveURL(contact.expectedUrlPattern(reference));
      await expect(contact.heading).toBeVisible();

      await contact.searchFor(token);
      await expect(contact.resultsSummary).toHaveText(`Showing ${MATCHING_RECORDS} out of ${MATCHING_RECORDS} results`);

      await contact.address(target.name).check();
      await contact.saveAndContinue.click();
      await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrlPattern(reference));
      await plantsPages.overview.open(reference);
      await expect(plantsPages.overview.taskRow(CONTACT)).toContainText('Completed');
      const review = pages.page.getByRole('listitem').filter({ hasText: 'Check and submit' });
      await expect(review).toContainText('Cannot start yet');
      await expect(review.getByRole('link')).toHaveCount(0);

      await contact.open(reference);
      await expectChosenAddressNamedAboveResults(contact.resultsHeading, target.name);

      await contact.searchFor(target.name);
      await expect(contact.address(target.name)).toBeChecked();
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
    await plantsPages.consignmentContactSelect.saveAndContinue.click();
    await plantsPages.arrivalDetails.open(reference);
    await plantsPages.arrivalDetails.dateQuestionLabelled('Expected date of arrival').fill('27/3/2027');
    await plantsPages.arrivalDetails.arrivalTime.fill('14:30');
    await plantsPages.arrivalDetails.placeOfLanding.choose(portByCode('GB ABD').display);
    await plantsPages.arrivalDetails.saveAndContinue.click();
    await plantsPages.placeOfDestination.open(reference);
    await plantsPages.placeOfDestination.searchFor(address.name);
    await plantsPages.placeOfDestination.address(address.name).check();
    await plantsPages.placeOfDestination.saveAndContinue.click();
    await plantsPages.identificationNumbers.open(reference);
    await plantsPages.identificationNumbers.producer.fill('P123');
    await plantsPages.identificationNumbers.crop.fill('C123');
    await plantsPages.identificationNumbers.saveAndContinue.click();
    await plantsPages.overview.open(reference);
    await pages.page.getByRole('link', { name: 'Check and submit', exact: true }).click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrlPattern(reference));
    await pages.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(pages.page).toHaveURL(plantsPages.declaration.expectedUrlPattern(reference));
    await expect(pages.page.getByRole('heading', { name: 'Declaration', level: 1 })).toBeVisible();
    await pages.page.getByRole('link', { name: 'Back', exact: true }).click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrlPattern(reference));
    await pages.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await pages.page
      .getByRole('checkbox', {
        name: 'I confirm that I have reviewed and comply with this declaration and that the information submitted in this notification is true and correct.',
      })
      .check();
    await pages.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(pages.page).toHaveURL(plantsPages.confirmation.expectedUrlPattern(reference));
    await expect(pages.page.getByRole('heading', { name: 'Notification submitted', level: 1 })).toBeVisible();
    await expect(pages.page.getByText('Your notification reference', { exact: false })).toContainText(reference);
  });

  test('ends with Save and continue and Save and return to hub side by side and Cancel and return to hub on its own line below them', async ({
    plantsPages,
    plantsJourney,
  }) => {
    await openContact(plantsPages, plantsJourney);

    await expectSaveControlsLayout(plantsPages.consignmentContactSelect, {
      saveAndReturnLabel: 'Save and return to hub',
      cancelAndReturnLink: plantsPages.consignmentContactSelect.cancelAndReturnToHub,
    });
  });

  for (const action of ['continue', 'return'] as const) {
    test(`blank contact permits save and ${action} and leaves the row incomplete`, async ({ pages, plantsPages, plantsJourney }) => {
      const reference = await openContact(plantsPages, plantsJourney);
      const contact = plantsPages.consignmentContactSelect;
      const button = action === 'continue' ? contact.saveAndContinue : contact.saveAndReturnToHub;
      await button.click();
      const landing = action === 'continue' ? plantsPages.notificationView : plantsPages.overview;
      await expect(pages.page).toHaveURL(landing.expectedUrlPattern(reference));
      await plantsPages.overview.open(reference);
      await expect(plantsPages.overview.taskRow(CONTACT)).toContainText('Not yet started');
      await contact.open(reference);
      await expect(contact.heading).toBeVisible();
      await expect(pages.page.getByRole('radio', { checked: true })).toHaveCount(0);
    });
  }
});

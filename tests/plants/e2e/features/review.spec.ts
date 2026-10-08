import { SET_BASES } from '@page-objects/shared/sets';
import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import type { PlantsPages, SharedPages } from '@page-objects';
import type { PlantsJourney } from '@flows/plants/journey';
import type { AddressBookApiClient, AddressBookRecord } from '@adapters/http/address-book-api-client';
import { getRelativeServiceDisplayDate } from '@utils/date-utils';

const POTATOES = 'Potatoes (seed or ware)';
const PLANTS = 'Plants for planting';
const potatoLine = { Variety: 'Maris Piper', Quantity: '250', 'Intended use': 'Planting' };

// Use London calendar dates, like the service, and stay away from timing boundaries.
function arrivalDate(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London' }).format(date);
}

type NotificationOptions = {
  type?: string;
  days?: number;
  contact?: boolean;
  /** The country the minted record carries. The address book API accepts any non-blank value; the journey does not. */
  countryCode?: string;
  /** The minted record's name. Must stay unique: the book is shared and never wiped. */
  name?: string;
  /** A record to pick instead of minting one, so two notifications can copy the same address. */
  existing?: AddressBookRecord;
};

async function completeNotification(
  pages: SharedPages,
  plantsPages: PlantsPages,
  journey: PlantsJourney,
  api: AddressBookApiClient,
  {
    type = POTATOES,
    days = 7,
    contact = true,
    countryCode = 'GB',
    name = `Review Nursery ${randomUUID()}`,
    existing,
  }: NotificationOptions = {},
) {
  const address =
    existing ??
    (await api.createAddress({
      name,
      addressLine1: '4 Nursery Lane',
      townOrCity: 'Perth',
      county: 'Perthshire',
      postcode: 'PH1 5EX',
      countryCode,
      phone: '01738 555 0143',
      email: 'review@example.co.uk',
    }));
  const reference = await journey.startNotification();
  await journey.chooseCommodityType(type);
  if (type === POTATOES) {
    await journey.addCommodityLine('Seed potatoes', potatoLine);
  } else {
    await journey.addCommodityLine(PLANTS, {
      Genus: 'Quercus (oak)',
      Species: 'Quercus robur',
      'Commodity code': '0602 20 20',
      Quantity: '120',
      'EPPO code': 'QUERO',
    });
  }
  await journey.toOrigin();
  if (type === POTATOES) {
    await journey.toArrivalDetails('France');
    await plantsPages.arrivalDetails.arrivalTime.fill('14:30');
    await plantsPages.arrivalDetails.selectPlaceOfLanding('Aberdeen Harbour (GB ABD)');
  } else {
    await journey.toArrivalStatus('Germany');
    await journey.answerArrivalStatus('Yes, it has already arrived');
  }
  await plantsPages.arrivalDetails.arrivalDate.fill(arrivalDate(days));
  await plantsPages.arrivalDetails.btnSaveAndContinue.click();
  await plantsPages.placeOfDestination.searchFor(address.name);
  await plantsPages.placeOfDestination.address(address.name).check();
  await plantsPages.placeOfDestination.btnSaveAndContinue.click();
  if (type === PLANTS) {
    await plantsPages.consignorSelect.searchFor(address.name);
    await plantsPages.consignorSelect.address(address.name).check();
    await plantsPages.consignorSelect.btnSaveAndContinue.click();
    await plantsPages.identificationNumbers.supplier.fill('S123');
  } else {
    await plantsPages.identificationNumbers.producer.fill('P123');
    await plantsPages.identificationNumbers.crop.fill('C123');
  }
  await plantsPages.identificationNumbers.btnSaveAndContinue.click();
  if (contact) {
    await plantsPages.consignmentContactSelect.searchFor(address.name);
    await plantsPages.consignmentContactSelect.address(address.name).check();
  }
  await plantsPages.consignmentContactSelect.btnSaveAndContinue.click();
  await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
  return { reference, address };
}

async function openReview(plantsPages: PlantsPages) {
  await plantsPages.overview.taskRowLink('Check and submit').click();
  await expect(plantsPages.notificationView.heading).toBeVisible();
}

async function submit(plantsPages: PlantsPages) {
  await plantsPages.notificationView.btnContinue.click();
  await plantsPages.declaration.checkbox.check();
  await plantsPages.declaration.btnContinue.click();
  await expect(plantsPages.confirmation.heading).toBeVisible();
}

async function assertReadOnly(plantsPages: PlantsPages) {
  await expect(plantsPages.notificationView.heading).toBeVisible();
  await expect(plantsPages.overview.statusTag).toHaveText('Submitted');
  await expect(plantsPages.notificationView.changeLinks).toHaveCount(0);
  await expect(plantsPages.notificationView.btnContinue).toHaveCount(0);
}

async function amend(pages: SharedPages, plantsPages: PlantsPages, reference: string) {
  await plantsPages.dashboard.open();
  await plantsPages.dashboard.searchForReference(reference);
  await plantsPages.dashboard
    .notificationCard(reference)
    .getByRole('button', { name: `Amend notification ${reference}`, exact: true })
    .click();
  await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
  await expect(plantsPages.overview.statusTag).toHaveText('Amending');
}

test.describe('High-risk plants check and submit section', { tag: '@integration' }, () => {
  test('review stays blocked until the final required row is complete', async ({ pages, plantsPages, plantsJourney, addressBookApi }) => {
    const { reference, address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi, { contact: false });
    const review = plantsPages.overview.taskRowByTitle('Check and submit');
    await expect(review).toContainText('Cannot start yet');
    await expect(review.getByRole('link')).toHaveCount(0);
    await plantsPages.consignmentContactSelect.open(reference);
    await plantsPages.consignmentContactSelect.searchFor(address.name);
    await plantsPages.consignmentContactSelect.address(address.name).check();
    await plantsPages.consignmentContactSelect.btnSaveAndContinue.click();
    await openReview(plantsPages);
  });

  test('CYA renders numbered sections, scoped cards and contact details, and Change returns to saved answers', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
    await openReview(plantsPages);
    await expect(pages.page.getByRole('heading', { level: 2, name: /^[1-3]\. / })).toHaveText([
      '1. About the consignment',
      '2. Arrival and destination',
      '3. Consignment parties',
    ]);
    await expect(plantsPages.notificationView.card('Consignor or exporter')).toHaveCount(0);
    const contact = plantsPages.notificationView.card('Contact');
    await expect(contact).toContainText(address.name);
    await expect(contact).toContainText('4 Nursery Lane, Perth, Perthshire, PH1 5EX');
    await expect(contact).toContainText('01738 555 0143');
    await expect(contact).toContainText('review@example.co.uk');
    await plantsPages.notificationView.change('Change country of origin (Import details)').click();
    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
    await plantsPages.origin.selectCountry('Germany');
    await plantsPages.origin.btnSaveAndContinue.click();
    await expect(plantsPages.notificationView.heading).toBeVisible();
    await expect(plantsPages.notificationView.card('Import details')).toContainText('Germany');
    await plantsPages.notificationView.change('Change Commodity 1 (Commodity 1)').click();
    await plantsPages.commodityDetails.field('Quantity').fill('300');
    await plantsPages.commodityDetails.btnSaveAndContinue.click();
    await plantsPages.commodities.btnSaveAndContinue.click();
    await expect(plantsPages.notificationView.heading).toBeVisible();
    await pages.page.reload();
    await expect(plantsPages.notificationView.card('Commodity 1')).toContainText('300');
  });

  test('declaration is required and submission produces a read-only notification and Submitted dashboard card', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
    await openReview(plantsPages);
    await plantsPages.notificationView.btnContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.declaration.expectedUrl(reference));
    await plantsPages.declaration.btnContinue.click();
    await expect(plantsPages.declaration.errorSummary).toContainText('Confirm that the information is true and correct before submitting');
    await expect(pages.page).toHaveURL(plantsPages.declaration.expectedUrl(reference));
    await plantsPages.declaration.linkBack.click();
    await expect(plantsPages.notificationView.heading).toBeVisible();
    await submit(plantsPages);
    await expect(pages.page).toHaveURL(plantsPages.confirmation.expectedUrl(reference));
    await expect(plantsPages.confirmation.panel).toContainText(reference);
    await expect(plantsPages.overview.statusTag).toHaveText('Submitted');
    await expect(plantsPages.confirmation.notificationDate).toBeVisible();
    await expect(plantsPages.confirmation.content).toContainText(
      new RegExp(`Date of notification[^0-9]{0,20}(${getRelativeServiceDisplayDate()}|${getRelativeServiceDisplayDate(1)})`),
    );
    await expect(plantsPages.confirmation.lateBanner).toHaveCount(0);
    await plantsPages.confirmation.viewNotification.click();
    await assertReadOnly(plantsPages);
    await expect(plantsPages.notificationView.lateBanner).toHaveCount(0);
    await plantsPages.dashboard.open();
    await plantsPages.dashboard.searchForReference(reference);
    await expect(plantsPages.dashboard.notificationCard(reference).getByText('Submitted', { exact: true })).toBeVisible();
  });

  for (const { type, days, rule } of [
    { type: POTATOES, days: 0, rule: 'Notifications for potatoes must be made at least 2 days before the expected date of arrival.' },
    {
      type: PLANTS,
      days: -7,
      rule: 'Notifications for plants for planting and wood must be made no later than 4 days after the date of arrival.',
    },
  ]) {
    test(`${type}: late notifications are accepted and highlighted`, async ({ pages, plantsPages, plantsJourney, addressBookApi }) => {
      const { reference } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi, { type, days });
      await openReview(plantsPages);
      // govukWarningText always prepends a visually-hidden "Warning" fallback inside
      // the same <strong>, so an exact match can never pass here — pin the message
      // as a substring instead (unpassable-assertion exception: the accessible-tree
      // snapshot shows `strong: Warning If you submit...`, the app renders the
      // correct message, and no other spec in this repo asserts govukWarningText by exact text).
      await expect(
        pages.page.getByText(`If you submit this notification today it will be late. ${rule} You can still submit it.`, { exact: false }),
      ).toBeVisible();
      await submit(plantsPages);
      await expect(plantsPages.confirmation.panel).toContainText(reference);
      await expect(plantsPages.confirmation.lateBanner).toBeVisible();
      await expect(pages.page.getByText(rule, { exact: false })).toBeVisible();
      await plantsPages.confirmation.viewNotification.click();
      await assertReadOnly(plantsPages);
      await expect(plantsPages.notificationView.lateBanner).toBeVisible();
      await plantsPages.dashboard.open();
      await plantsPages.dashboard.searchForReference(reference);
      await expect(plantsPages.dashboard.notificationCard(reference).getByText('Submitted', { exact: true })).toBeVisible();
      // No dashboard Late tag assertion: ruled c-030/c-035 parks projecting
      // lateNotificationIndicator onto the backend NotificationDto ("the mapper
      // has no typed home for it ... explicit omission assertion on the
      // NotificationDto" — plants-frontend rulings.json panel/rulings.json). The
      // stub persistence layer already carries the row field correctly (proven
      // directly against the stub), but this stack runs the real
      // trade-imports-plants-backend, which has no such field yet (confirmed:
      // no lateNotificationIndicator anywhere under plants-backend/src/main) — so
      // the tag cannot render here until that residual-parked mapping is built.
    });
  }

  test('a saved French origin becomes invalid when a ware-potato line is added and prevents submission', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
    await plantsPages.commodities.open(reference);
    await plantsJourney.addAnotherCommodityLine('Ware potatoes', { ...potatoLine, 'Intended use': 'Consumption' });
    await plantsPages.notificationView.open(reference);
    await expect(plantsPages.notificationView.card('Import details')).toContainText('France');
    await plantsPages.notificationView.btnContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    const correction = plantsPages.notificationView.errorSummary.getByRole('link', { name: /Poland/ });
    await expect(correction).toHaveAttribute('href', `${SET_BASES.highRiskPlants}/notifications/${reference}/origin?change=1`);
    await expect(plantsPages.overview.statusTag).toHaveText('Draft');
    await correction.click();
    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
  });

  test('a destination deleted from the address book keeps its copy on CYA and submits', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
    await openReview(plantsPages);
    await addressBookApi.deleteAddress(address.id);
    await pages.page.reload();
    const destination = plantsPages.notificationView.card('Place of destination');
    await expect(destination).toContainText(address.name);
    await expect(destination).toContainText('PH1 5EX');
    await submit(plantsPages);
    await expect(pages.page).toHaveURL(plantsPages.confirmation.expectedUrl(reference));

    // The submitted notification keeps the copy even though its record is gone.
    await plantsPages.confirmation.viewNotification.click();
    await assertReadOnly(plantsPages);
    await expect(destination).toContainText(address.name);
    await expect(destination).toContainText('PH1 5EX');
  });

  test('editing the record in the address book does not change what the notification shows', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
    const originalName = address.name;
    const renamed = `Renamed Holding ${randomUUID()}`;

    // The notification holds a copy taken when the address was picked, so a
    // later change to the record must not reach the picker card or CYA.
    await addressBookApi.updateAddress(address.id, {
      name: renamed,
      addressLine1: '4 Nursery Lane',
      townOrCity: 'Dundee',
      postcode: 'DD1 1AA',
      countryCode: 'GB',
      phone: '01738 555 0143',
      email: 'review@example.co.uk',
    });

    await plantsPages.placeOfDestination.open(reference);
    await expect(plantsPages.placeOfDestination.currentAddress).toContainText(originalName);
    await expect(plantsPages.placeOfDestination.currentAddress).not.toContainText(renamed);

    await plantsPages.notificationView.open(reference);
    const destination = plantsPages.notificationView.card('Place of destination');
    await expect(destination).toContainText(originalName);
    await expect(destination).toContainText('Perth');
    await expect(destination).toContainText('PH1 5EX');
    await expect(destination).not.toContainText(renamed);
    await expect(destination).not.toContainText('Dundee');
  });

  for (const source of ['dashboard', 'CYA']) {
    test(`cancel amendment from ${source} restores submitted answers and read-only CYA`, async ({
      pages,
      plantsPages,
      plantsJourney,
      addressBookApi,
    }) => {
      const { reference } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
      await openReview(plantsPages);
      await submit(plantsPages);
      await amend(pages, plantsPages, reference);
      await plantsPages.identificationNumbers.open(reference);
      await plantsPages.identificationNumbers.producer.fill('DiscardMe99');
      await plantsPages.identificationNumbers.btnSaveAndContinue.click();
      await plantsPages.dashboard.open();
      await plantsPages.dashboard.searchForReference(reference);
      await expect(plantsPages.dashboard.statusTag(reference)).toHaveText('Amending');
      if (source === 'dashboard') {
        await plantsPages.dashboard
          .notificationCard(reference)
          .getByRole('link', { name: `Cancel amendment (${reference})`, exact: true })
          .click();
      } else {
        await plantsPages.notificationView.open(reference);
        await expect(plantsPages.notificationView.card('Identification numbers')).toContainText('DiscardMe99');
        await pages.page.getByRole('link', { name: 'Cancel amendment', exact: true }).click();
      }
      await expect(pages.page.getByRole('heading', { name: 'Cancel this amendment?', level: 1 })).toBeVisible();
      await pages.page.getByRole('button', { name: 'Yes, cancel amendment', exact: true }).click();
      await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
      await assertReadOnly(plantsPages);
      await expect(pages.page.getByRole('alert')).toContainText(/amendment.*cancelled/i);
      await expect(plantsPages.notificationView.card('Identification numbers')).toContainText('P123');
      await expect(plantsPages.notificationView.card('Identification numbers')).not.toContainText('DiscardMe99');
      await pages.page.reload();
      await assertReadOnly(plantsPages);
      await expect(plantsPages.notificationView.card('Identification numbers')).toContainText('P123');
    });
  }

  test('a submitted notification can be deleted from CYA', async ({ pages, plantsPages, plantsJourney, addressBookApi }) => {
    const { reference } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
    await openReview(plantsPages);
    await submit(plantsPages);
    await plantsPages.confirmation.viewNotification.click();
    await pages.page.getByRole('button', { name: 'Delete notification', exact: true }).click();
    await expect(plantsPages.deleteNotification.heading).toBeVisible();
    await plantsPages.deleteNotification.btnConfirm.click();
    await expect(plantsPages.dashboard.heading).toBeVisible();
    await expect(plantsPages.dashboard.deletedBanner).toContainText('Notification deleted');
    await plantsPages.dashboard.searchForReference(reference);
    await expect(plantsPages.dashboard.notificationCard(reference)).toHaveCount(0);
  });

  for (const initiallyLate of [true, false]) {
    test(`resubmitting an amended arrival date preserves the original ${initiallyLate ? 'late' : 'on-time'} flag`, async ({
      pages,
      plantsPages,
      plantsJourney,
      addressBookApi,
    }) => {
      const { reference } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi, { days: initiallyLate ? 0 : 7 });
      await openReview(plantsPages);
      await submit(plantsPages);
      await plantsPages.confirmation.viewNotification.click();
      await expect(plantsPages.notificationView.lateBanner).toHaveCount(initiallyLate ? 1 : 0);
      await amend(pages, plantsPages, reference);
      await plantsPages.arrivalDetails.open(reference);
      const amendedDate = arrivalDate(initiallyLate ? 7 : 0);
      await plantsPages.arrivalDetails.arrivalDate.fill(amendedDate);
      await plantsPages.arrivalDetails.btnSaveAndContinue.click();
      await plantsPages.notificationView.open(reference);
      await submit(plantsPages);
      await expect(plantsPages.confirmation.lateBanner).toHaveCount(initiallyLate ? 1 : 0);
      await plantsPages.confirmation.viewNotification.click();
      await pages.page.reload();
      await assertReadOnly(plantsPages);
      // readDate (shared/kit.js) keeps the day/month/year digits verbatim from the
      // single free-text field, so the card echoes the zero-padded string as typed.
      await expect(plantsPages.notificationView.card('Arrival details')).toContainText(amendedDate);
      await expect(plantsPages.notificationView.lateBanner).toHaveCount(initiallyLate ? 1 : 0);
    });
  }
});

test.describe('High-risk plants copied addresses are edited on the notification', { tag: '@integration' }, () => {
  test('Edit details on CYA changes only this notification, not the address book record or another notification', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    test.slow();
    const { reference: otherReference, address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
    const { reference } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi, { existing: address });
    const editedName = `Edited Holding ${randomUUID()}`;

    await plantsPages.notificationView.open(reference);
    await plantsPages.notificationView.editDetails('Place of destination').click();
    const form = plantsPages.placeOfDestinationEdit;
    await expect(form.heading).toBeVisible();
    await form.fill({ name: editedName, townOrCity: 'Dundee', postcode: 'DD1 1AA' });
    await form.saveChanges.click();

    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    const destination = plantsPages.notificationView.card('Place of destination');
    await expect(destination).toContainText(editedName);
    await expect(destination).toContainText('Dundee');
    await expect(destination).not.toContainText('PH1 5EX');

    expect(await addressBookApi.getAddress(address.id)).toMatchObject({ name: address.name, townOrCity: 'Perth', deleted: false });

    await plantsPages.notificationView.open(otherReference);
    await expect(destination).toContainText(address.name);
    await expect(destination).not.toContainText(editedName);
  });

  test('the edit form opens from the picker with every field, including County', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);

    await plantsPages.consignmentContactSelect.open(reference);
    await expect(plantsPages.consignmentContactSelect.currentAddress).toContainText(address.name);
    await plantsPages.consignmentContactSelect.editCurrentAddress.click();

    const form = plantsPages.contactAddressEdit;
    await expect(form.heading).toBeVisible();
    await expect(form.roleCaption).toBeVisible();
    await expect(form.name).toHaveValue(address.name);
    await expect(form.addressLine1).toHaveValue('4 Nursery Lane');
    await expect(form.addressLine2).toHaveValue('');
    await expect(form.townOrCity).toHaveValue('Perth');
    await expect(form.county).toHaveValue('Perthshire');
    await expect(form.postcode).toHaveValue('PH1 5EX');
    await expect(form.country).toHaveValue('GB');
    await expect(form.phone).toHaveValue('01738 555 0143');
    await expect(form.email).toHaveValue('review@example.co.uk');

    // Cancel goes back to the picker it was opened from, leaving the copy as it was.
    await form.fill({ name: 'Never Saved Ltd' });
    await form.cancel.click();
    await expect(pages.page).toHaveURL(plantsPages.consignmentContactSelect.expectedUrl(reference));
    await expect(plantsPages.consignmentContactSelect.currentAddress).toContainText(address.name);
    await expect(plantsPages.consignmentContactSelect.currentAddress).not.toContainText('Never Saved Ltd');
  });

  test('the consignor picker shows the copied address and its Edit details opens the consignor edit form', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi, {
      type: PLANTS,
      days: -1,
    });

    await plantsPages.consignorSelect.open(reference);
    await expect(plantsPages.consignorSelect.currentAddress).toContainText(address.name);
    await expect(plantsPages.consignorSelect.currentAddress).toContainText('PH1 5EX');
    await plantsPages.consignorSelect.editCurrentAddress.click();

    const form = plantsPages.consignorEdit;
    await expect(pages.page).toHaveURL((url) => url.pathname === form.expectedUrl(reference));
    await expect(form.heading).toBeVisible();
    await expect(form.roleCaption).toBeVisible();
    await expect(form.name).toHaveValue(address.name);
    await expect(form.postcode).toHaveValue('PH1 5EX');
  });

  test('an edit that breaks the address book rules is refused with its messages, and nothing is saved', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);

    await plantsPages.notificationView.open(reference);
    await plantsPages.notificationView.editDetails('Place of destination').click();
    const form = plantsPages.placeOfDestinationEdit;
    await form.fill({ name: '', postcode: 'PH1 5EX 12345', email: 'not-an-email' });
    await form.saveChanges.click();

    await expect(form.heading).toBeVisible();
    await expect(form.errorSummary).toContainText('Enter a name');
    await expect(form.errorSummary).toContainText('Postcode must be 12 characters or fewer');
    await expect(form.errorSummary).toContainText('Enter an email address in the correct format');
    await expect(form.name).toHaveAccessibleDescription(/Enter a name/);
    await expect(form.postcode).toHaveAccessibleDescription(/Postcode must be 12 characters or fewer/);
    await expect(form.email).toHaveAccessibleDescription(/Enter an email address in the correct format/);

    await plantsPages.notificationView.open(reference);
    const destination = plantsPages.notificationView.card('Place of destination');
    await expect(destination).toContainText(address.name);
    await expect(destination).not.toContainText('PH1 5EX 12345');
  });

  test('a copied address that breaks the address book rules blocks Continue and Submit until it is corrected', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    test.slow();
    // The address book API takes any non-blank country, so a record can hold a
    // country name where the journey expects a code. Named for what it is, since
    // it stays in the shared book for anyone picking addresses by hand.
    const { reference } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi, {
      countryCode: 'United Kingdom',
      name: `Invalid address (country "United Kingdom" is not a code) ${randomUUID()}`,
    });
    // The same record was picked for the destination and the contact, so both copies break the rules.
    const error = 'Correct the address details for the place of destination';
    const contactError = 'Correct the contact address details for this consignment';

    await openReview(plantsPages);
    await expect(plantsPages.notificationView.errorSummary).toContainText(error);
    await expect(plantsPages.notificationView.errorSummary).toContainText(contactError);
    // The card says which field to correct, against the row that holds it.
    await expect(plantsPages.notificationView.row('Place of destination', 'Address')).toContainText('Enter a valid country');
    await expect(plantsPages.notificationView.row('Place of destination', 'Name')).not.toContainText('Enter');
    await plantsPages.notificationView.btnContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(plantsPages.notificationView.errorSummary).toContainText(error);

    // A bookmarked declaration cannot submit what the review refuses.
    await plantsPages.declaration.open(reference);
    await plantsPages.declaration.checkbox.check();
    await plantsPages.declaration.btnContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(plantsPages.overview.statusTag).not.toHaveText('Submitted');

    // Correcting one address clears its own error and leaves the other.
    await plantsPages.notificationView.errorSummary.getByRole('link', { name: error }).click();
    await expect(plantsPages.placeOfDestinationEdit.heading).toBeVisible();
    await plantsPages.placeOfDestinationEdit.country.selectOption('GB');
    await plantsPages.placeOfDestinationEdit.saveChanges.click();

    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(plantsPages.notificationView.errorSummary).not.toContainText(error);
    await expect(plantsPages.notificationView.errorSummary).toContainText(contactError);

    await plantsPages.notificationView.errorSummary.getByRole('link', { name: contactError }).click();
    await expect(plantsPages.contactAddressEdit.heading).toBeVisible();
    await plantsPages.contactAddressEdit.country.selectOption('GB');
    await plantsPages.contactAddressEdit.saveChanges.click();

    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(plantsPages.notificationView.errorSummary).toHaveCount(0);
    await submit(plantsPages);
  });
});

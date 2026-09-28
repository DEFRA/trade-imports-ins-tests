import { SET_BASES } from '@page-objects/base/sets';
import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import type { PageObjects } from '@page-objects';
import type { PlantsJourney } from '@flows/plants-journey';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
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

async function completeNotification(
  pages: PageObjects,
  journey: PlantsJourney,
  api: AddressBookApiClient,
  { type = POTATOES, days = 7, contact = true } = {},
) {
  const address = await api.createAddress({
    name: `Review Nursery ${randomUUID()}`,
    addressLine1: '4 Nursery Lane',
    townOrCity: 'Perth',
    postcode: 'PH1 5EX',
    countryCode: 'GB',
    phone: '01738 555 0143',
    email: 'review@example.co.uk',
  });
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
    await pages.plantsArrivalDetails.arrivalTime.fill('14:30');
    await pages.plantsArrivalDetails.selectPlaceOfLanding('Aberdeen Harbour (GB ABD)');
  } else {
    await journey.toArrivalStatus('Germany');
    await journey.answerArrivalStatus('Yes, it has already arrived');
  }
  await pages.plantsArrivalDetails.arrivalDate.fill(arrivalDate(days));
  await pages.plantsArrivalDetails.btnSaveAndContinue.click();
  await pages.plantsPlaceOfDestination.searchFor(address.name);
  await pages.plantsPlaceOfDestination.address(address.name).check();
  await pages.plantsPlaceOfDestination.btnSaveAndContinue.click();
  if (type === PLANTS) {
    await pages.plantsConsignorSelect.searchFor(address.name);
    await pages.plantsConsignorSelect.address(address.name).check();
    await pages.plantsConsignorSelect.btnSaveAndContinue.click();
    await pages.plantsIdentificationNumbers.supplier.fill('S123');
  } else {
    await pages.plantsIdentificationNumbers.producer.fill('P123');
    await pages.plantsIdentificationNumbers.crop.fill('C123');
  }
  await pages.plantsIdentificationNumbers.btnSaveAndContinue.click();
  if (contact) {
    await pages.plantsConsignmentContactSelect.searchFor(address.name);
    await pages.plantsConsignmentContactSelect.address(address.name).check();
  }
  await pages.plantsConsignmentContactSelect.btnSaveAndContinue.click();
  await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
  return { reference, address };
}

async function openReview(pages: PageObjects) {
  await pages.plantsOverview.taskRowLink('Check and submit').click();
  await expect(pages.plantsNotificationView.heading).toBeVisible();
}

async function submit(pages: PageObjects) {
  await pages.plantsNotificationView.btnContinue.click();
  await pages.plantsDeclaration.checkbox.check();
  await pages.plantsDeclaration.btnContinue.click();
  await expect(pages.plantsConfirmation.heading).toBeVisible();
}

async function assertReadOnly(pages: PageObjects) {
  await expect(pages.plantsNotificationView.heading).toBeVisible();
  await expect(pages.plantsOverview.statusTag).toHaveText('Submitted');
  await expect(pages.plantsNotificationView.changeLinks).toHaveCount(0);
  await expect(pages.plantsNotificationView.btnContinue).toHaveCount(0);
}

async function amend(pages: PageObjects, reference: string) {
  await pages.plantsDashboard.open();
  await pages.plantsDashboard.searchForReference(reference);
  await pages.plantsDashboard
    .notificationCard(reference)
    .getByRole('button', { name: `Amend notification ${reference}`, exact: true })
    .click();
  await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
  await expect(pages.plantsOverview.statusTag).toHaveText('Amending');
}

test.describe('High-risk plants check and submit section', { tag: '@integration' }, () => {
  test('review stays blocked until the final required row is complete', async ({ pages, plantsJourney, addressBookApi }) => {
    const { reference, address } = await completeNotification(pages, plantsJourney, addressBookApi, { contact: false });
    const review = pages.plantsOverview.taskRowByTitle('Check and submit');
    await expect(review).toContainText('Cannot start yet');
    await expect(review.getByRole('link')).toHaveCount(0);
    await pages.plantsConsignmentContactSelect.open(reference);
    await pages.plantsConsignmentContactSelect.searchFor(address.name);
    await pages.plantsConsignmentContactSelect.address(address.name).check();
    await pages.plantsConsignmentContactSelect.btnSaveAndContinue.click();
    await openReview(pages);
  });

  test('CYA renders numbered sections, scoped cards and contact details, and Change returns to saved answers', async ({
    pages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { address } = await completeNotification(pages, plantsJourney, addressBookApi);
    await openReview(pages);
    await expect(pages.page.getByRole('heading', { level: 2, name: /^[1-3]\. / })).toHaveText([
      '1. About the consignment',
      '2. Arrival and destination',
      '3. Consignment parties',
    ]);
    await expect(pages.plantsNotificationView.card('Consignor or exporter')).toHaveCount(0);
    const contact = pages.plantsNotificationView.card('Contact');
    await expect(contact).toContainText(address.name);
    await expect(contact).toContainText('4 Nursery Lane, Perth, PH1 5EX');
    await expect(contact).toContainText('01738 555 0143');
    await expect(contact).toContainText('review@example.co.uk');
    await pages.plantsNotificationView.change('Change country of origin (Import details)').click();
    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
    await pages.plantsOrigin.selectCountry('Germany');
    await pages.plantsOrigin.btnSaveAndContinue.click();
    await expect(pages.plantsNotificationView.heading).toBeVisible();
    await expect(pages.plantsNotificationView.card('Import details')).toContainText('Germany');
    await pages.plantsNotificationView.change('Change Commodity 1 (Commodity 1)').click();
    await pages.plantsCommodityDetails.field('Quantity').fill('300');
    await pages.plantsCommodityDetails.btnSaveAndContinue.click();
    await pages.plantsCommodities.btnSaveAndContinue.click();
    await expect(pages.plantsNotificationView.heading).toBeVisible();
    await pages.page.reload();
    await expect(pages.plantsNotificationView.card('Commodity 1')).toContainText('300');
  });

  test('declaration is required and submission produces a read-only notification and Submitted dashboard card', async ({
    pages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference } = await completeNotification(pages, plantsJourney, addressBookApi);
    await openReview(pages);
    await pages.plantsNotificationView.btnContinue.click();
    await expect(pages.page).toHaveURL(pages.plantsDeclaration.expectedUrl(reference));
    await pages.plantsDeclaration.btnContinue.click();
    await expect(pages.plantsDeclaration.errorSummary).toContainText('Confirm that the information is true and correct before submitting');
    await expect(pages.page).toHaveURL(pages.plantsDeclaration.expectedUrl(reference));
    await pages.plantsDeclaration.linkBack.click();
    await expect(pages.plantsNotificationView.heading).toBeVisible();
    await submit(pages);
    await expect(pages.page).toHaveURL(pages.plantsConfirmation.expectedUrl(reference));
    await expect(pages.plantsConfirmation.panel).toContainText(reference);
    await expect(pages.plantsOverview.statusTag).toHaveText('Submitted');
    await expect(pages.plantsConfirmation.notificationDate).toBeVisible();
    await expect(pages.plantsConfirmation.content).toContainText(
      new RegExp(`Date of notification[^0-9]{0,20}(${getRelativeServiceDisplayDate()}|${getRelativeServiceDisplayDate(1)})`),
    );
    await expect(pages.plantsConfirmation.lateBanner).toHaveCount(0);
    await pages.plantsConfirmation.viewNotification.click();
    await assertReadOnly(pages);
    await expect(pages.plantsNotificationView.lateBanner).toHaveCount(0);
    await pages.plantsDashboard.open();
    await pages.plantsDashboard.searchForReference(reference);
    await expect(pages.plantsDashboard.notificationCard(reference).getByText('Submitted', { exact: true })).toBeVisible();
  });

  for (const { type, days, rule } of [
    { type: POTATOES, days: 0, rule: 'Notifications for potatoes must be made at least 2 days before the expected date of arrival.' },
    {
      type: PLANTS,
      days: -7,
      rule: 'Notifications for plants for planting and wood must be made no later than 4 days after the date of arrival.',
    },
  ]) {
    test(`${type}: late notifications are accepted and highlighted`, async ({ pages, plantsJourney, addressBookApi }) => {
      const { reference } = await completeNotification(pages, plantsJourney, addressBookApi, { type, days });
      await openReview(pages);
      // govukWarningText always prepends a visually-hidden "Warning" fallback inside
      // the same <strong>, so an exact match can never pass here — pin the message
      // as a substring instead (unpassable-assertion exception: the accessible-tree
      // snapshot shows `strong: Warning If you submit...`, the app renders the
      // correct message, and no other spec in this repo asserts govukWarningText by exact text).
      await expect(
        pages.page.getByText(`If you submit this notification today it will be late. ${rule} You can still submit it.`, { exact: false }),
      ).toBeVisible();
      await submit(pages);
      await expect(pages.plantsConfirmation.panel).toContainText(reference);
      await expect(pages.plantsConfirmation.lateBanner).toBeVisible();
      await expect(pages.page.getByText(rule, { exact: false })).toBeVisible();
      await pages.plantsConfirmation.viewNotification.click();
      await assertReadOnly(pages);
      await expect(pages.plantsNotificationView.lateBanner).toBeVisible();
      await pages.plantsDashboard.open();
      await pages.plantsDashboard.searchForReference(reference);
      await expect(pages.plantsDashboard.notificationCard(reference).getByText('Submitted', { exact: true })).toBeVisible();
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
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference } = await completeNotification(pages, plantsJourney, addressBookApi);
    await pages.plantsCommodities.open(reference);
    await plantsJourney.addAnotherCommodityLine('Ware potatoes', { ...potatoLine, 'Intended use': 'Consumption' });
    await pages.plantsNotificationView.open(reference);
    await expect(pages.plantsNotificationView.card('Import details')).toContainText('France');
    await pages.plantsNotificationView.btnContinue.click();
    await expect(pages.page).toHaveURL(pages.plantsNotificationView.expectedUrl(reference));
    const correction = pages.plantsNotificationView.errorSummary.getByRole('link', { name: /Poland/ });
    await expect(correction).toHaveAttribute('href', `${SET_BASES.highRiskPlants}/notifications/${reference}/origin?change=1`);
    await expect(pages.plantsOverview.statusTag).toHaveText('Draft');
    await correction.click();
    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
  });

  test('a deleted destination renders Not provided on CYA and blocks submission', async ({ pages, plantsJourney, addressBookApi }) => {
    const { reference, address } = await completeNotification(pages, plantsJourney, addressBookApi);
    await openReview(pages);
    await addressBookApi.deleteAddress(address.id);
    await pages.page.reload();
    const destination = pages.plantsNotificationView.card('Place of destination');
    await expect(destination.getByText('Not provided', { exact: true })).toHaveCount(4);
    await expect(destination).not.toContainText(address.name);
    await pages.plantsNotificationView.btnContinue.click();
    await expect(pages.page).toHaveURL(pages.plantsNotificationView.expectedUrl(reference));
    await expect(pages.plantsNotificationView.errorSummary).toContainText('Select an address for the place of destination');
  });

  test('editing a linked address in the address book changes what the notification shows', async ({
    pages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await completeNotification(pages, plantsJourney, addressBookApi);
    const originalName = address.name;
    const renamed = `Renamed Holding ${randomUUID()}`;

    await pages.plantsPlaceOfDestination.open(reference);
    await expect(pages.plantsPlaceOfDestination.selectedAddress(originalName)).toBeVisible();
    await pages.plantsNotificationView.open(reference);
    const destination = pages.plantsNotificationView.card('Place of destination');
    await expect(destination).toContainText(originalName);
    await expect(destination).toContainText('Perth');
    await expect(destination).toContainText('PH1 5EX');

    // The notification stores the address-book id only. Editing the record
    // behind the journey's back must change what the picker inset and CYA
    // card show; a copy taken at selection would still read the old details.
    await addressBookApi.updateAddress(address.id, {
      name: renamed,
      addressLine1: '4 Nursery Lane',
      townOrCity: 'Dundee',
      postcode: 'DD1 1AA',
      countryCode: 'GB',
      phone: '01738 555 0143',
      email: 'review@example.co.uk',
    });

    await pages.plantsPlaceOfDestination.open(reference);
    await expect(pages.plantsPlaceOfDestination.selectedAddress(renamed)).toBeVisible();
    await expect(pages.plantsPlaceOfDestination.selectedAddress(originalName)).toHaveCount(0);

    await pages.plantsNotificationView.open(reference);
    await expect(destination).toContainText(renamed);
    await expect(destination).toContainText('Dundee');
    await expect(destination).toContainText('DD1 1AA');
    await expect(destination).not.toContainText(originalName);
    await expect(destination).not.toContainText('Perth');
    await expect(destination).not.toContainText('PH1 5EX');
  });

  for (const source of ['dashboard', 'CYA']) {
    test(`cancel amendment from ${source} restores submitted answers and read-only CYA`, async ({
      pages,
      plantsJourney,
      addressBookApi,
    }) => {
      const { reference } = await completeNotification(pages, plantsJourney, addressBookApi);
      await openReview(pages);
      await submit(pages);
      await amend(pages, reference);
      await pages.plantsIdentificationNumbers.open(reference);
      await pages.plantsIdentificationNumbers.producer.fill('DiscardMe99');
      await pages.plantsIdentificationNumbers.btnSaveAndContinue.click();
      await pages.plantsDashboard.open();
      await pages.plantsDashboard.searchForReference(reference);
      await expect(pages.plantsDashboard.statusTag(reference)).toHaveText('Amending');
      if (source === 'dashboard') {
        await pages.plantsDashboard
          .notificationCard(reference)
          .getByRole('link', { name: `Cancel amendment (${reference})`, exact: true })
          .click();
      } else {
        await pages.plantsNotificationView.open(reference);
        await expect(pages.plantsNotificationView.card('Identification numbers')).toContainText('DiscardMe99');
        await pages.page.getByRole('link', { name: 'Cancel amendment', exact: true }).click();
      }
      await expect(pages.page.getByRole('heading', { name: 'Cancel this amendment?', level: 1 })).toBeVisible();
      await pages.page.getByRole('button', { name: 'Yes, cancel amendment', exact: true }).click();
      await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
      await assertReadOnly(pages);
      await expect(pages.page.getByRole('alert')).toContainText(/amendment.*cancelled/i);
      await expect(pages.plantsNotificationView.card('Identification numbers')).toContainText('P123');
      await expect(pages.plantsNotificationView.card('Identification numbers')).not.toContainText('DiscardMe99');
      await pages.page.reload();
      await assertReadOnly(pages);
      await expect(pages.plantsNotificationView.card('Identification numbers')).toContainText('P123');
    });
  }

  test('a submitted notification can be deleted from CYA', async ({ pages, plantsJourney, addressBookApi }) => {
    const { reference } = await completeNotification(pages, plantsJourney, addressBookApi);
    await openReview(pages);
    await submit(pages);
    await pages.plantsConfirmation.viewNotification.click();
    await pages.page.getByRole('button', { name: 'Delete notification', exact: true }).click();
    await expect(pages.plantsDeleteNotification.heading).toBeVisible();
    await pages.plantsDeleteNotification.btnConfirm.click();
    await expect(pages.plantsDashboard.heading).toBeVisible();
    await expect(pages.plantsDashboard.deletedBanner).toContainText('Notification deleted');
    await pages.plantsDashboard.searchForReference(reference);
    await expect(pages.plantsDashboard.notificationCard(reference)).toHaveCount(0);
  });

  for (const initiallyLate of [true, false]) {
    test(`resubmitting an amended arrival date preserves the original ${initiallyLate ? 'late' : 'on-time'} flag`, async ({
      pages,
      plantsJourney,
      addressBookApi,
    }) => {
      const { reference } = await completeNotification(pages, plantsJourney, addressBookApi, { days: initiallyLate ? 0 : 7 });
      await openReview(pages);
      await submit(pages);
      await pages.plantsConfirmation.viewNotification.click();
      await expect(pages.plantsNotificationView.lateBanner).toHaveCount(initiallyLate ? 1 : 0);
      await amend(pages, reference);
      await pages.plantsArrivalDetails.open(reference);
      const amendedDate = arrivalDate(initiallyLate ? 7 : 0);
      await pages.plantsArrivalDetails.arrivalDate.fill(amendedDate);
      await pages.plantsArrivalDetails.btnSaveAndContinue.click();
      await pages.plantsNotificationView.open(reference);
      await submit(pages);
      await expect(pages.plantsConfirmation.lateBanner).toHaveCount(initiallyLate ? 1 : 0);
      await pages.plantsConfirmation.viewNotification.click();
      await pages.page.reload();
      await assertReadOnly(pages);
      // readDate (shared/kit.js) keeps the day/month/year digits verbatim from the
      // single free-text field, so the card echoes the zero-padded string as typed.
      await expect(pages.plantsNotificationView.card('Arrival details')).toContainText(amendedDate);
      await expect(pages.plantsNotificationView.lateBanner).toHaveCount(initiallyLate ? 1 : 0);
    });
  }
});

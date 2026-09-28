import { test, expect } from '@fixtures';

test.describe('Addresses are linked, not copied', { tag: ['@integration'] }, () => {
  test('editing a linked address in the address book changes what the draft notification shows', async ({
    journey,
    pages,
    addressBookApi,
  }) => {
    // Its own address rather than a shared fixture: this spec edits the record,
    // and the E2E fixtures are shared with every other spec running alongside it.
    // Distinct names, not one derived from the other, so "the old name is gone"
    // is a real assertion rather than one substring matching another.
    const stamp = Date.now();
    const originalName = `Linked Farm ${stamp}`;
    const renamed = `Renamed Holding ${stamp}`;
    const address = await addressBookApi.createAddress({
      name: originalName,
      addressLine1: '3 Link Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 1AA',
      countryCode: 'United Kingdom',
      phone: '01228 555 0102',
      email: 'linked@example.co.uk',
    });

    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    const consignorRow = pages.addresses.partyRow('Consignor or exporter');
    await pages.addresses.addParty('Consignor or exporter').click();

    // Newly created, so it is at the back of the book — search rather than page.
    await pages.consignorSelection.search.fill(originalName);
    await pages.consignorSelection.searchButton.click();
    await pages.consignorSelection.party(originalName).check();
    await pages.consignorSelection.saveAndContinue.click();

    // The landing row renders the party's name — that name is read back from
    // the address book on every render, so it is what shows the link is live.
    await expect(pages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText(originalName);

    // Edit the record in the address book, with the journey none the wiser. If
    // the notification held a copy, the row would still read the old details.
    await addressBookApi.updateAddress(address.id, {
      name: renamed,
      addressLine1: '3 Link Lane',
      townOrCity: 'Penrith',
      postcode: 'CA11 7AA',
      countryCode: 'United Kingdom',
      phone: '01228 555 0102',
      email: 'linked@example.co.uk',
    });

    // A copy taken at selection would still read the old name here.
    await pages.page.reload();
    await expect(consignorRow).toContainText(renamed);
    await expect(consignorRow).not.toContainText(originalName);

    // The landing row only shows the name. Check-your-answers renders the full
    // resolved block (party-row.js), so that is where AC4's "latest details"
    // for town/postcode are visible. Opened directly rather than through the
    // hub, so this leg does not depend on how the hub routes to the review.
    const journeyId = pages.addresses.journeyIdFromUrl();
    await pages.notificationView.open(journeyId);
    const rolesAndAddresses = pages.notificationView.summaryCard('Roles and addresses');
    const consignorValue = rolesAndAddresses
      .locator('.govuk-summary-list__row', { has: pages.page.getByText('Consignor', { exact: true }) })
      .locator('.govuk-summary-list__value');
    await expect(consignorValue).toContainText(renamed);
    await expect(consignorValue).toContainText('Penrith');
    await expect(consignorValue).toContainText('CA11 7AA');
    await expect(consignorValue).not.toContainText('Carlisle');
    await expect(consignorValue).not.toContainText('CA1 1AA');
  });

  test('editing a linked place of origin in the address book changes what the draft notification shows', async ({
    journey,
    pages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const originalName = `Linked Origin ${stamp}`;
    const renamed = `Renamed Origin ${stamp}`;
    const address = await addressBookApi.createAddress({
      name: originalName,
      addressLine1: '4 Origin Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 1AA',
      countryCode: 'United Kingdom',
      phone: '01228 555 0105',
      email: 'origin-link@example.co.uk',
    });

    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    const originRow = pages.addresses.partyRow('Place of origin');
    await pages.addresses.addParty('Place of origin').click();
    await pages.placeOfOriginSelection.search.fill(originalName);
    await pages.placeOfOriginSelection.searchButton.click();
    await pages.placeOfOriginSelection.party(originalName).check();
    await pages.placeOfOriginSelection.saveAndContinue.click();

    await expect(pages.addresses.heading).toBeVisible();
    await expect(originRow).toContainText(originalName);

    await addressBookApi.updateAddress(address.id, {
      name: renamed,
      addressLine1: '4 Origin Lane',
      townOrCity: 'Penrith',
      postcode: 'CA11 7AA',
      countryCode: 'United Kingdom',
      phone: '01228 555 0105',
      email: 'origin-link@example.co.uk',
    });

    await pages.page.reload();
    await expect(originRow).toContainText(renamed);
    await expect(originRow).not.toContainText(originalName);

    const journeyId = pages.addresses.journeyIdFromUrl();
    await pages.notificationView.open(journeyId);
    const originCyaRow = pages.notificationView.partyRow('Roles and addresses', 'Place of origin');
    await expect(originCyaRow).toContainText(renamed);
    await expect(originCyaRow).toContainText('Penrith');
    await expect(originCyaRow).toContainText('CA11 7AA');
    await expect(originCyaRow).not.toContainText('Carlisle');
    await expect(originCyaRow).not.toContainText('CA1 1AA');
  });

  test('deleting a linked address treats it as never entered and hides it from the picker', async ({ journey, pages, addressBookApi }) => {
    // Own record so parallel specs do not race on a shared fixture when this one
    // soft-deletes behind the journey's back.
    const stamp = Date.now();
    const name = `Doomed Farm ${stamp}`;
    const address = await addressBookApi.createAddress({
      name,
      addressLine1: '7 Gone Street',
      townOrCity: 'Carlisle',
      postcode: 'CA1 2BB',
      countryCode: 'United Kingdom',
      phone: '01228 555 0103',
      email: 'doomed@example.co.uk',
    });

    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    const consignorRow = pages.addresses.partyRow('Consignor or exporter');
    await pages.addresses.addParty('Consignor or exporter').click();
    await pages.consignorSelection.search.fill(name);
    await pages.consignorSelection.searchButton.click();
    await pages.consignorSelection.party(name).check();
    await pages.consignorSelection.saveAndContinue.click();
    await expect(pages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText(name);

    // Soft-delete behind the journey's back. List/search omit tombstones; get
    // by id still returns deleted:true so the deletion is detectable.
    await addressBookApi.deleteAddress(address.id);
    const tombstone = await addressBookApi.getAddress(address.id);
    expect(tombstone.deleted).toBe(true);

    // UCD: a deleted linked address renders as if never entered — "Not added
    // yet" and an Add action (resolve-parties.js returns undefined).
    await pages.page.reload();
    await expect(consignorRow).toContainText('Not added yet');
    await expect(consignorRow).not.toContainText(name);
    await expect(pages.addresses.addParty('Consignor or exporter')).toBeVisible();

    // AC2: the picker no longer offers the deleted record.
    await pages.addresses.addParty('Consignor or exporter').click();
    await pages.consignorSelection.search.fill(name);
    await pages.consignorSelection.searchButton.click();
    await expect(pages.consignorSelection.party(name)).toHaveCount(0);
  });

  test('the review page names a deleted address, walks the trader to a replacement and lets the submit through once it is replaced', async ({
    seededJourney,
    pages,
    addressBookApi,
  }) => {
    test.slow();

    const stamp = Date.now();
    const name = `Replaceable Farm ${stamp}`;
    const address = await addressBookApi.createAddress({
      name,
      addressLine1: '9 Swap Street',
      townOrCity: 'Carlisle',
      postcode: 'CA1 3CC',
      countryCode: 'United Kingdom',
      phone: '01228 555 0104',
      email: 'replaceable@example.co.uk',
    });

    // A complete notification, then swap the consignor for our own record —
    // the shared fixtures cannot be deleted without breaking every spec
    // running alongside this one.
    const referenceNumber = await seededJourney.createDraftNotification('readyToSubmit');
    await seededJourney.resumeInUi(referenceNumber, pages.notificationView);
    await pages.notificationView.changeLink('Change roles and addresses').click();
    await expect(pages.addresses.heading).toBeVisible();
    await pages.addresses.changeParty('Consignor or exporter').click();
    await pages.consignorSelection.select(name);
    await pages.consignorSelection.saveAndContinue.click();
    await expect(pages.addresses.heading).toBeVisible();
    await pages.addresses.continueButton.click();

    // The Change link brought us back here rather than into the section flow,
    // which is what makes the replacement loop below close.
    await expect(pages.notificationView.heading).toBeVisible();
    const consignorRow = pages.notificationView.partyRow('Roles and addresses', 'Consignor');
    await expect(consignorRow).toContainText(name);
    await expect(pages.notificationView.errorSummary).toHaveCount(0);

    // A colleague deletes it while the draft is still open.
    await addressBookApi.deleteAddress(address.id);
    await pages.page.reload();

    // AC1: named at the top of the page and against the role's own row.
    const message = 'Select an address for the consignor';
    await expect(pages.notificationView.errorSummary).toContainText(message);
    await expect(pages.notificationView.partyError('Roles and addresses', 'Consignor')).toContainText(message);
    await expect(consignorRow).not.toContainText(name);

    // AC1: and the submit is refused while it stands.
    await pages.notificationView.continueButton.click();
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.errorSummary).toContainText(message);

    // AC3: the message is the way through to a replacement.
    await pages.notificationView.errorSummary.getByRole('link', { name: message }).click();
    await expect(pages.addresses.heading).toBeVisible();
    await pages.addresses.addParty('Consignor or exporter').click();
    await pages.consignorSelection.select('Astra Rosales');
    await pages.consignorSelection.saveAndContinue.click();
    await expect(pages.addresses.heading).toBeVisible();
    await pages.addresses.continueButton.click();

    // AC3: back where the error was raised, with it gone.
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.errorSummary).toHaveCount(0);
    await expect(consignorRow).toContainText('Astra Rosales');

    // AC3: and the submit now goes through.
    await pages.notificationView.continueButton.click();
    await expect(pages.declaration.heading).toBeVisible();
    await pages.declaration.confirmation.check();
    await pages.declaration.continueButton.click();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
  });
});

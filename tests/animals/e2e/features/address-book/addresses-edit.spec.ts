import { test, expect } from '@fixtures';
import type { AnimalsPages } from '@page-objects';
import type { AnimalsSeededJourney } from '@flows/animals/seeded-journey';

const OWN_RECORD = {
  addressLine1: '12 Copy Street',
  addressLine2: 'Unit 4',
  townOrCity: 'Carlisle',
  county: 'Cumbria',
  postcode: 'CA1 5EE',
  countryCode: 'GB',
  phone: '01228 555 0110',
  email: 'edit-copy@example.co.uk',
};

/** A ready-to-submit notification whose consignor is a copy of the named record. */
async function draftWithConsignor(animalsSeededJourney: AnimalsSeededJourney, animalsPages: AnimalsPages, name: string): Promise<string> {
  const journeyId = await animalsSeededJourney.createDraftNotification('readyToSubmit');
  await animalsSeededJourney.resumeInUi(journeyId, animalsPages.addresses);
  await animalsPages.addresses.changeParty('Consignor or exporter').click();
  await animalsPages.consignorSelection.select(name);
  await animalsPages.consignorSelection.saveAndContinue.click();
  await animalsPages.addresses.heading.waitFor();
  return journeyId;
}

test.describe('Copied addresses are edited on the notification', { tag: ['@integration'] }, () => {
  test('editing a copied address changes only this notification, not the address book record or another notification', async ({
    animalsSeededJourney,
    animalsPages,
    addressBookApi,
  }) => {
    test.slow();

    // Own record: a broken edit would reach the book, and the shared fixtures
    // are read by every other spec running alongside this one.
    const stamp = Date.now();
    const name = `Editable Farm ${stamp}`;
    const editedName = `Edited Holding ${stamp}`;
    const address = await addressBookApi.createAddress({ name, ...OWN_RECORD });

    const otherJourneyId = await draftWithConsignor(animalsSeededJourney, animalsPages, name);
    const journeyId = await draftWithConsignor(animalsSeededJourney, animalsPages, name);

    await animalsPages.addresses.editPartyDetails('Consignor or exporter').click();
    await expect(animalsPages.consignorEdit.heading).toBeVisible();
    await animalsPages.consignorEdit.fill({ name: editedName, townOrCity: 'Penrith', postcode: 'CA11 9ZZ' });
    await animalsPages.consignorEdit.saveChanges.click();

    // This notification shows the edited details, on the hub and in full on the review.
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(animalsPages.addresses.partyRow('Consignor or exporter')).toContainText(editedName);

    await animalsPages.notificationView.open(journeyId);
    const consignorRow = animalsPages.notificationView.partyRow('Roles and addresses', 'Consignor');
    await expect(consignorRow).toContainText(editedName);
    await expect(consignorRow).toContainText('Penrith');
    await expect(consignorRow).toContainText('CA11 9ZZ');
    await expect(consignorRow).not.toContainText('Carlisle');

    // The address book record is as it was created.
    const record = await addressBookApi.getAddress(address.id);
    expect(record).toMatchObject({ name, townOrCity: 'Carlisle', postcode: 'CA1 5EE', deleted: false });

    // The other notification holding a copy of the same record is untouched.
    await animalsPages.notificationView.open(otherJourneyId);
    await expect(consignorRow).toContainText(name);
    await expect(consignorRow).toContainText('Carlisle');
    await expect(consignorRow).not.toContainText(editedName);
    await expect(consignorRow).not.toContainText('Penrith');
  });

  test('the edit form opens with the copied details, including the county', async ({
    animalsSeededJourney,
    animalsPages,
    addressBookApi,
  }) => {
    const name = `Prefilled Farm ${Date.now()}`;
    await addressBookApi.createAddress({ name, ...OWN_RECORD });
    await draftWithConsignor(animalsSeededJourney, animalsPages, name);

    await animalsPages.addresses.editPartyDetails('Consignor or exporter').click();

    const form = animalsPages.consignorEdit;
    await expect(form.heading).toBeVisible();
    await expect(form.roleCaption).toBeVisible();
    await expect(form.hint).toBeVisible();
    await expect(form.name).toHaveValue(name);
    await expect(form.addressLine1).toHaveValue(OWN_RECORD.addressLine1);
    await expect(form.addressLine2).toHaveValue(OWN_RECORD.addressLine2);
    await expect(form.townOrCity).toHaveValue(OWN_RECORD.townOrCity);
    await expect(form.county).toHaveValue(OWN_RECORD.county);
    await expect(form.postcode).toHaveValue(OWN_RECORD.postcode);
    await expect(form.country).toHaveValue(OWN_RECORD.countryCode);
    await expect(form.phone).toHaveValue(OWN_RECORD.phone);
    await expect(form.email).toHaveValue(OWN_RECORD.email);
  });

  test('an edit that breaks the address book rules is refused with its messages, at the top and against each field, and nothing is saved', async ({
    animalsSeededJourney,
    animalsPages,
  }) => {
    const journeyId = await animalsSeededJourney.createDraftNotification('readyToSubmit');
    await animalsSeededJourney.resumeInUi(journeyId, animalsPages.addresses);
    await animalsPages.addresses.editPartyDetails('Place of origin').click();

    const form = animalsPages.placeOfOriginEdit;
    await expect(form.roleCaption).toBeVisible();
    await form.fill({ name: '', postcode: 'CA11 9ZZ 1234', email: 'not-an-email' });
    await form.chooseUnlistedCountry('XX');
    await form.saveChanges.click();

    await expect(form.heading).toBeVisible();
    await expect(form.errorSummary).toContainText('Enter a name');
    await expect(form.errorSummary).toContainText('Postcode must be 12 characters or fewer');
    await expect(form.errorSummary).toContainText('Enter an email address in the correct format');
    await expect(form.errorSummary).toContainText('Enter a country');
    await expect(form.name).toHaveAccessibleDescription(/Enter a name/);
    await expect(form.postcode).toHaveAccessibleDescription(/Postcode must be 12 characters or fewer/);
    await expect(form.email).toHaveAccessibleDescription(/Enter an email address in the correct format/);
    await expect(form.country).toHaveAccessibleDescription(/Enter a country/);

    await animalsPages.notificationView.open(journeyId);
    const originRow = animalsPages.notificationView.partyRow('Roles and addresses', 'Place of origin');
    await expect(originRow).toContainText('Origin Farm');
    await expect(originRow).toContainText('V95 X7P2');
    await expect(originRow).not.toContainText('CA11 9ZZ 1234');
  });

  test('cancelling an edit returns to where it was started and leaves the copy as it was', async ({
    animalsSeededJourney,
    pages,
    animalsPages,
  }) => {
    const journeyId = await animalsSeededJourney.createDraftNotification('readyToSubmit');

    // From the review page, back to the review page.
    await animalsSeededJourney.resumeInUi(journeyId, animalsPages.notificationView);
    await animalsPages.notificationView.editPartyDetails('Roles and addresses', 'Consignor').click();
    await expect(animalsPages.consignorEdit.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/consignors\/edit\?return=notification-view/);
    await animalsPages.consignorEdit.fill({ name: 'Never Saved Ltd' });
    await animalsPages.consignorEdit.cancel.click();

    await expect(animalsPages.notificationView.heading).toBeVisible();
    const consignorRow = animalsPages.notificationView.partyRow('Roles and addresses', 'Consignor');
    await expect(consignorRow).toContainText('Astra Rosales');
    await expect(consignorRow).not.toContainText('Never Saved Ltd');

    // From the contact page, back to the contact page.
    await animalsSeededJourney.resumeInUi(journeyId, animalsPages.contactAddress);
    await animalsPages.contactAddress.editCurrentContact.click();
    await expect(animalsPages.contactAddressEdit.heading).toBeVisible();
    await animalsPages.contactAddressEdit.fill({ townOrCity: 'Never Saved Town' });
    await animalsPages.contactAddressEdit.cancel.click();

    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.contactAddress.currentContact).toContainText('Addlestone');
    await expect(animalsPages.contactAddress.currentContact).not.toContainText('Never Saved Town');
  });

  test('a copied address offers both Change and Edit details on the hub, the contact page and the review, and an unanswered role offers only Add', async ({
    animalsSeededJourney,
    animalsPages,
  }) => {
    const journeyId = await animalsSeededJourney.createDraftNotification('readyToSubmit');

    await animalsSeededJourney.resumeInUi(journeyId, animalsPages.addresses);
    await expect(animalsPages.addresses.changeParty('Consignor or exporter')).toBeVisible();
    await expect(animalsPages.addresses.editPartyDetails('Consignor or exporter')).toBeVisible();
    await expect(animalsPages.addresses.addParty('Consignor or exporter')).toHaveCount(0);

    // The list below chooses a different contact; the current one is edited apart from it.
    await animalsSeededJourney.resumeInUi(journeyId, animalsPages.contactAddress);
    await expect(animalsPages.contactAddress.address('Animal and Plant Health Agency')).toBeVisible();
    await expect(animalsPages.contactAddress.editCurrentContact).toBeVisible();

    // The review keeps one Change per card, and an Edit details per copied address.
    await animalsSeededJourney.resumeInUi(journeyId, animalsPages.notificationView);
    await expect(animalsPages.notificationView.changeLink('Change roles and addresses')).toBeVisible();
    await expect(animalsPages.notificationView.editPartyDetails('Roles and addresses', 'Consignor')).toBeVisible();
    await expect(animalsPages.notificationView.changeLink(/^Change contact address/)).toBeVisible();
    await expect(animalsPages.notificationView.editPartyDetails('Contact address for this consignment', 'Contact address')).toBeVisible();

    const unansweredJourneyId = await animalsSeededJourney.createDraftNotification('unlocked');
    await animalsSeededJourney.resumeInUi(unansweredJourneyId, animalsPages.addresses);
    await expect(animalsPages.addresses.addParty('Consignor or exporter')).toBeVisible();
    await expect(animalsPages.addresses.changeParty('Consignor or exporter')).toHaveCount(0);
    await expect(animalsPages.addresses.editPartyDetails('Consignor or exporter')).toHaveCount(0);

    await animalsSeededJourney.resumeInUi(unansweredJourneyId, animalsPages.contactAddress);
    await expect(animalsPages.contactAddress.currentContact).toHaveCount(0);
  });

  test('editing the contact address from the contact page changes only this notification', async ({
    animalsSeededJourney,
    animalsPages,
    addressBookApi,
  }) => {
    const contact = 'Animal and Plant Health Agency';
    const editedName = `APHA Weybridge ${Date.now()}`;
    const journeyId = await animalsSeededJourney.createDraftNotification('readyToSubmit');

    await animalsSeededJourney.resumeInUi(journeyId, animalsPages.contactAddress);
    await animalsPages.contactAddress.editCurrentContact.click();
    const form = animalsPages.contactAddressEdit;
    await expect(form.roleCaption).toBeVisible();
    await expect(form.name).toHaveValue(contact);
    await form.fill({ name: editedName, addressLine1: 'New Haw', townOrCity: 'Weybridge' });
    await form.saveChanges.click();

    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.contactAddress.currentContact).toContainText(editedName);
    await expect(animalsPages.contactAddress.chosenAddress).toHaveCount(0);

    await animalsPages.notificationView.open(journeyId);
    const contactRow = animalsPages.notificationView.partyRow('Contact address for this consignment', 'Contact address');
    await expect(contactRow).toContainText(editedName);
    await expect(contactRow).toContainText('Weybridge');
    await expect(contactRow).not.toContainText('Addlestone');

    const record = await addressBookApi.findByName(contact);
    expect(record).toMatchObject({ addressLine1: 'Woodham Lane', townOrCity: 'Addlestone' });
    expect(await addressBookApi.listAddresses(editedName)).toHaveLength(0);
  });
});

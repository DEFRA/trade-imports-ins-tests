import { test, expect } from '@fixtures';

// Canned private-transporter record (mirrors the frontend happy-path fixture).
const transporter = {
  name: 'Jean Dupont',
  address: {
    addressLine1: '12 Rue des Fermes',
    townOrCity: 'Amiens',
    postalOrZipCode: '80000',
    country: 'France',
    telephoneNumber: '+33 3 22 55 01 44',
    emailAddress: 'jean.dupont@example.fr',
  },
};

test.describe('Private transporter scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('keyed-in details are owed only for the private type; a partial fill blocks the save; changing the type wipes them', async ({
    journey,
    pages,
  }) => {
    await journey.startNotification();
    await journey.unlockSections();

    const openTransporters = () => journey.reachTransporterFromHub();

    // The type question sits behind "Add a transporter" now, so every branch is
    // reached through the add route rather than off the list itself.
    const chooseType = async (type: 'Commercial' | 'Private') => {
      await pages.transporter.addTransporter.click();
      await pages.transporterAdd.heading.waitFor();
      await pages.transporterAdd.transporterType(type).check();
      await pages.transporterAdd.saveAndContinue.click();
    };

    // Private transporter: the details page opens. A PARTIAL fill blocks the
    // save — the fieldGroup's mandates apply once the record is provided —
    // naming the missing mandatory fields.
    await openTransporters();
    await chooseType('Private');
    await expect(pages.privateTransporter.heading).toBeVisible();
    await pages.page.getByLabel('Name or organisation name').fill(transporter.name);
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Enter address line 1' })).toBeVisible();

    // Completing the mandatory fields commits the whole group as one
    // { name, address } object and finishes the section.
    await pages.page.getByLabel('Address line 1').fill(transporter.address.addressLine1);
    await pages.page.getByLabel('Town or city').fill(transporter.address.townOrCity);
    await pages.page.getByLabel('Postcode or Zip code').fill(transporter.address.postalOrZipCode);
    await pages.page.getByLabel('Country').selectOption(transporter.address.country);
    await pages.page.getByLabel('Phone number').fill(transporter.address.telephoneNumber);
    await pages.page.getByLabel('Email address').fill(transporter.address.emailAddress);
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(pages.overview.heading).toBeVisible();

    // The record persists: walking back in flattens the saved object into
    // the form fields.
    await openTransporters();
    await chooseType('Private');
    await expect(pages.privateTransporter.heading).toBeVisible();
    await expect(pages.page.getByLabel('Name or organisation name')).toHaveValue(transporter.name);
    await expect(pages.page.getByLabel('Country')).toHaveValue(transporter.address.country);
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();

    // Commercial transporter: the private details page is no longer owed —
    // saving the type walks to the add-commercial form instead; a blank save
    // there returns to the hub.
    await openTransporters();
    await chooseType('Commercial');
    await expect(pages.commercialTransporter.heading).toBeVisible();
    await pages.commercialTransporter.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();

    // Back to private: leaving scope wiped the saved details — the form
    // renders empty.
    await openTransporters();
    await chooseType('Private');
    await expect(pages.privateTransporter.heading).toBeVisible();
    await expect(pages.page.getByLabel('Name or organisation name')).toHaveValue('');
    await expect(pages.page.getByLabel('Country')).toHaveValue('');
  });
});

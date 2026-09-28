import { test, expect } from '@fixtures';

// Canned commercial-transporter record — a transporter that is not on the
// approved list, which is the whole reason the add-commercial form exists.
const transporter = {
  approvalNumber: 'NI/TA/2026/0041',
  name: 'Lough Neagh Livestock Haulage Ltd',
  addressLine1: '4 Shore Road',
  townOrCity: 'Antrim',
  postalOrZipCode: 'BT41 4LB',
  emailAddress: 'ops@loughneagh.example',
  telephoneNumber: '+44 28 9446 1200',
};

test.describe('Commercial transporter scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('commercial transporter is owed only for the commercial type and is wiped when the type changes', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    const openTransporters = () => animalsJourney.reachTransporterFromHub();

    // The type question sits behind "Add a transporter" now, so every branch is
    // reached through the add route rather than off the list itself.
    const chooseType = async (type: 'Commercial' | 'Private') => {
      await animalsPages.transporter.addTransporter.click();
      await animalsPages.transporterAdd.heading.waitFor();
      await animalsPages.transporterAdd.transporterType(type).check();
      await animalsPages.transporterAdd.saveAndContinue.click();
    };

    // Commercial transporter: the add-commercial form opens; the country is
    // fixed to Northern Ireland rather than asked, and the details keyed in are
    // saved as the commercial answer.
    await openTransporters();
    await chooseType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(animalsPages.commercialTransporter.country).toHaveValue('Northern Ireland');
    await animalsPages.commercialTransporter.fill(transporter);
    await animalsPages.commercialTransporter.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    // The record persists: walking back in flattens the saved object into the
    // form fields.
    await openTransporters();
    await chooseType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(animalsPages.commercialTransporter.approvalNumber).toHaveValue(transporter.approvalNumber);
    await expect(animalsPages.commercialTransporter.nameOrOrganisationName).toHaveValue(transporter.name);
    await animalsPages.commercialTransporter.saveAndContinue.click();

    // Private transporter: the add-commercial form is no longer owed — choosing
    // the private type walks on to the private details page; a blank save there
    // returns to the hub.
    await openTransporters();
    await chooseType('Private');
    await expect(animalsPages.privateTransporter.heading).toBeVisible();
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(animalsPages.overview.heading).toBeVisible();

    // Back to commercial: leaving scope wiped the saved transporter — the form
    // renders empty.
    await openTransporters();
    await chooseType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(animalsPages.commercialTransporter.approvalNumber).toHaveValue('');
    await expect(animalsPages.commercialTransporter.nameOrOrganisationName).toHaveValue('');
  });
});

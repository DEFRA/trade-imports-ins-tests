import { test, expect } from '@fixtures';

// Canned commercial-transporter record — mirrors commercial-transporter-scope.spec.ts.
const transporter = {
  approvalNumber: 'NI/TA/2026/0041',
  name: 'Lough Neagh Livestock Haulage Ltd',
  addressLine1: '4 Shore Road',
  townOrCity: 'Antrim',
  postalOrZipCode: 'BT41 4LB',
  emailAddress: 'ops@loughneagh.example',
  telephoneNumber: '+44 28 9446 1200',
};

test.describe('Commercial transporter journeys', { tag: '@integration' }, () => {
  test('a trader can submit a notification using a hand-added commercial transporter', async ({ seededJourney, pages }) => {
    // EUDPA-636 — commercial-transporter-details.controller.js never calls
    // rememberTransporter(), so a hand-added commercial transporter can never
    // pass the register check the task list and review page re-run. Remove
    // this annotation once the fix lands.
    test.fail(true, 'EUDPA-636');

    // Everything up to transport is seeded through the API — only the
    // scenario under test (transit countries onward) is driven through the UI.
    const journeyId = await seededJourney.createDraftNotification('draft');
    await seededJourney.resumeInUi(journeyId, pages.transitedCountries);

    await pages.transitedCountries.addCountry('France');
    await pages.transitedCountries.addCountry('Belgium');
    await pages.transitedCountries.saveAndContinue.click();

    await pages.transporter.heading.waitFor();
    await pages.transporter.addTransporter.click();
    await pages.transporterAdd.heading.waitFor();
    await pages.transporterAdd.transporterType('Commercial').check();
    await pages.transporterAdd.saveAndContinue.click();
    await pages.commercialTransporter.heading.waitFor();
    await pages.commercialTransporter.fill(transporter);
    await pages.commercialTransporter.saveAndContinue.click();

    await pages.overview.heading.waitFor();
    await pages.overview.task('Contact address for this consignment').click();
    await pages.contactAddress.address('Animal and Plant Health Agency').check();
    await pages.contactAddress.saveAndContinue.click();
    await pages.overview.heading.waitFor();

    await pages.overview.reviewAndSubmitButton.click();
    await pages.notificationView.heading.waitFor();
    await pages.notificationView.continueButton.click();
    // Bounded rather than the default page-load wait — EUDPA-636 means this
    // never resolves right now, so fail fast instead of hanging.
    await pages.declaration.heading.waitFor({ timeout: 10_000 });
    await pages.declaration.confirmation.check();
    await pages.declaration.continueButton.click();

    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
  });
});

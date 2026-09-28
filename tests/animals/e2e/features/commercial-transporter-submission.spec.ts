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
  test('a trader can submit a notification using a hand-added commercial transporter', async ({ seededJourney, pages, animalsPages }) => {
    // EUDPA-636 — commercial-transporter-details.controller.js never calls
    // rememberTransporter(), so a hand-added commercial transporter can never
    // pass the register check the task list and review page re-run. Remove
    // this annotation once the fix lands.
    test.fail(true, 'EUDPA-636');

    // Everything up to transport is seeded through the API — only the
    // scenario under test (transit countries onward) is driven through the UI.
    const journeyId = await seededJourney.createDraftNotification('draft');
    await seededJourney.resumeInUi(journeyId, animalsPages.transitedCountries);

    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.addCountry('Belgium');
    await animalsPages.transitedCountries.saveAndContinue.click();

    await animalsPages.transporter.heading.waitFor();
    await animalsPages.transporter.addTransporter.click();
    await animalsPages.transporterAdd.heading.waitFor();
    await animalsPages.transporterAdd.transporterType('Commercial').check();
    await animalsPages.transporterAdd.saveAndContinue.click();
    await animalsPages.commercialTransporter.heading.waitFor();
    await animalsPages.commercialTransporter.fill(transporter);
    await animalsPages.commercialTransporter.saveAndContinue.click();

    await animalsPages.overview.heading.waitFor();
    await animalsPages.overview.task('Contact address for this consignment').click();
    await animalsPages.contactAddress.address('Animal and Plant Health Agency').check();
    await animalsPages.contactAddress.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();

    await animalsPages.overview.reviewAndSubmitButton.click();
    await animalsPages.notificationView.heading.waitFor();
    await animalsPages.notificationView.continueButton.click();
    // Bounded rather than the default page-load wait — EUDPA-636 means this
    // never resolves right now, so fail fast instead of hanging.
    await animalsPages.declaration.heading.waitFor({ timeout: 10_000 });
    await animalsPages.declaration.confirmation.check();
    await animalsPages.declaration.continueButton.click();

    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
  });
});

import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';

// govuk-frontend's conditional-reveal radios set aria-expanded on the radio input,
// which axe's aria-allowed-attr rule rejects.
const conditionalRadioInput = '#regionOfOriginCodeRequirement';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.startNotificationAtOrigin();
  });

  test('each notification journey page with validation has no accessibility violations when errors are shown', async ({
    journey,
    pages,
    runA11yScan,
  }) => {
    const errorSummaryHeading = pages.page.getByRole('heading', { name: 'There is a problem' });

    // EUDPA-636 — commercial-transporter-details.controller.js never calls
    // rememberTransporter(), so the "Add commercial transporter" step below
    // leaves the journey unable to reach Declaration. Remove this annotation
    // once the fix lands.
    test.fail(true, 'EUDPA-636');

    await test.step('Origin of import with validation errors', async () => {
      await pages.overview.task('Where is this consignment coming from?').click();
      await pages.originOfImport.heading.waitFor();
      await expect(pages.originOfImport.countryOfOrigin).toHaveValue('');
      await pages.originOfImport.radioRequiresOriginCode('Yes').check();
      await pages.originOfImport.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan({ exclude: conditionalRadioInput });
      await journey.fillOriginOfImport();
      await journey.saveOriginOfImport();
      await pages.overview.heading.waitFor();
    });

    await test.step('Continue to CPH number', async () => {
      await journey.answerCommodity();
      await journey.fillAddressesToCph();
    });

    await test.step('CPH number with validation errors', async () => {
      await pages.cphNumber.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await pages.cphNumber.fillCphNumber();
      await pages.cphNumber.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Arrival details with validation errors', async () => {
      await pages.overview.task('Arrival details').click();
      await pages.arrivalDetails.heading.waitFor();
      await pages.arrivalDetails.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await journey.fillArrivalDetails();
      await pages.arrivalDetails.saveAndContinue.click();
    });

    await test.step('Transited countries with validation errors', async () => {
      await pages.transitedCountries.heading.waitFor();
      await pages.transitedCountries.addCountryButton.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await pages.transitedCountries.addCountry('France');
      await pages.transitedCountries.saveAndContinue.click();
    });

    await test.step('Continue to declaration', async () => {
      await pages.transporter.heading.waitFor();
      await pages.transporter.addTransporter.click();
      await pages.transporterAdd.heading.waitFor();
      await pages.transporterAdd.transporterType('Commercial').check();
      await pages.transporterAdd.saveAndContinue.click();
      await pages.commercialTransporter.heading.waitFor();
      await pages.commercialTransporter.fill({
        approvalNumber: 'NI/TA/2026/0041',
        name: 'Lough Neagh Livestock Haulage Ltd',
        addressLine1: '4 Shore Road',
        townOrCity: 'Antrim',
        postalOrZipCode: 'BT41 4LB',
        emailAddress: 'ops@loughneagh.example',
        telephoneNumber: '+44 28 9446 1200',
      });
      await pages.commercialTransporter.saveAndContinue.click();
      await pages.overview.heading.waitFor();
      await journey.answerAnimalIdentification();
      await journey.answerReasonAndAdditionalDetails();
      await journey.answerContact();
      await pages.overview.reviewAndSubmitButton.click();
      await pages.notificationView.heading.waitFor();
      await pages.notificationView.continueButton.click();
      // Bounded rather than the full 300s a11y timeout — EUDPA-636 means this
      // never resolves right now, so fail fast instead of hanging.
      await pages.declaration.heading.waitFor({ timeout: 10_000 });
    });

    await test.step('Declaration with validation errors', async () => {
      await pages.declaration.continueButton.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
    });
  });
});

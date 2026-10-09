import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';
import { getRelativeDatePickerValue } from '@utils/date-utils';

// govuk-frontend's conditional-reveal radios set aria-expanded on the radio input,
// which axe's aria-allowed-attr rule rejects.
const conditionalRadioInput = '#regionOfOriginCodeRequirement';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.startNotificationAtOrigin();
  });

  test('each notification journey page with validation has no accessibility violations when errors are shown', async ({
    animalsJourney,
    pages,
    animalsPages,
    runA11yScan,
  }) => {
    const errorSummaryHeading = pages.page.getByRole('heading', { name: 'There is a problem' });

    await test.step('Origin of import with validation errors', async () => {
      await animalsPages.overview.task('Where is this consignment coming from?').click();
      await animalsPages.originOfImport.heading.waitFor();
      await expect(animalsPages.originOfImport.countryOfOrigin).toHaveValue('');
      await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
      await animalsPages.originOfImport.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan({ exclude: conditionalRadioInput });
      await animalsJourney.fillOriginOfImport();
      await animalsJourney.saveOriginOfImport();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Continue to CPH number', async () => {
      await animalsJourney.answerCommodity();
      await animalsJourney.fillAddressesAndOpenCph();
    });

    await test.step('CPH number with validation errors', async () => {
      await animalsPages.cphNumber.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await animalsPages.cphNumber.fillCphNumber();
      await animalsPages.cphNumber.saveAndContinue.click();
      await animalsPages.addresses.heading.waitFor();
      await animalsPages.addresses.continueButton.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Arrival details with validation errors', async () => {
      await animalsPages.overview.task('Arrival details').click();
      await animalsPages.arrivalDetails.heading.waitFor();
      // Every field is optional on a draft, so an empty save goes through; an arrival
      // date outside the allowed window is what raises the error summary.
      await animalsPages.arrivalDetails.fillArrivalDate(getRelativeDatePickerValue({ yearOffset: -1 }));
      await animalsPages.arrivalDetails.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await animalsJourney.fillArrivalDetails();
      await animalsPages.arrivalDetails.saveAndContinue.click();
    });

    await test.step('Transited countries with validation errors', async () => {
      await animalsPages.transitedCountries.heading.waitFor();
      await animalsPages.transitedCountries.addCountryButton.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await animalsPages.transitedCountries.addCountry('France');
      await animalsPages.transitedCountries.saveAndContinue.click();
    });

    await test.step('Continue to declaration', async () => {
      await animalsPages.transporter.heading.waitFor();
      await animalsPages.transporter.addTransporter.click();
      await animalsPages.transporterAdd.heading.waitFor();
      await animalsPages.transporterAdd.transporterType('Commercial').check();
      await animalsPages.transporterAdd.saveAndContinue.click();
      await animalsPages.commercialTransporter.heading.waitFor();
      await animalsPages.commercialTransporter.fill({
        approvalNumber: 'NI/TA/2026/0041',
        name: 'Lough Neagh Livestock Haulage Ltd',
        addressLine1: '4 Shore Road',
        townOrCity: 'Antrim',
        postalOrZipCode: 'BT41 4LB',
        emailAddress: 'ops@loughneagh.example',
        telephoneNumber: '+44 28 9446 1200',
      });
      await animalsPages.commercialTransporter.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsJourney.answerAnimalIdentification();
      await animalsJourney.answerReasonAndAdditionalDetails();
      await animalsJourney.answerContact();
      await animalsPages.overview.reviewAndSubmitButton.click();
      await animalsPages.notificationView.heading.waitFor();
      await animalsPages.notificationView.continueButton.click();
      await animalsPages.declaration.heading.waitFor();
    });

    await test.step('Declaration with validation errors', async () => {
      await animalsPages.declaration.continueButton.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
    });
  });
});

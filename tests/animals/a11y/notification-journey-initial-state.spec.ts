import { test, WCAG_STANDARD } from '@fixtures/a11y';

// govuk-frontend's conditional-reveal radios set aria-expanded on the radio input
// (radios.mjs), which axe's aria-allowed-attr rule rejects — an upstream
// disagreement, not a service defect. Exclude just that input from origin scans.
const conditionalRadioInput = '#regionOfOriginCodeRequirement';

// The same upstream disagreement on the reason page, where four of the five
// reasons open a conditional reveal, so four radios carry aria-expanded.
const conditionalReasonRadios = 'input[name="reasonForImport"][aria-controls]';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  test('each notification journey page has no accessibility violations on initial load', async ({ journey, animalsPages, runA11yScan }) => {
    // EUDPA-636 — commercial-transporter-details.controller.js never calls
    // rememberTransporter(), so the "Add commercial transporter" step below
    // leaves the journey unable to reach Declaration. Remove this annotation
    // once the fix lands.
    test.fail(true, 'EUDPA-636');

    await test.step('Notification dashboard', async () => {
      await runA11yScan();
    });

    await test.step('Origin of import', async () => {
      await animalsPages.dashboard.btnCreateNewNotification.click();
      await animalsPages.originOfImport.heading.waitFor();
      await runA11yScan({ exclude: conditionalRadioInput });
    });

    // The entry guard holds the journey on origin until it is answered, so the
    // overview is only reachable once origin has been saved.
    await test.step('Overview', async () => {
      const journeyId = animalsPages.originOfImport.journeyIdFromUrl();
      await journey.fillOriginOfImport();
      await journey.saveOriginOfImport();
      await animalsPages.overview.open(journeyId);
      await animalsPages.overview.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Commodity selection', async () => {
      await animalsPages.overview.task('What are you importing?').click();
      await animalsPages.commoditySelection.heading.waitFor();
      await runA11yScan();
      await animalsPages.commoditySelection.selectSpecies(['Bos taurus']);
      await animalsPages.commoditySelection.saveAndContinue.click();
    });

    await test.step('Commodity details', async () => {
      await animalsPages.consignmentDetails.heading.waitFor();
      await runA11yScan();
      await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
      await animalsPages.consignmentDetails.numberOfPackages.fill('5');
      await animalsPages.consignmentDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Animal identification', async () => {
      await animalsPages.overview.task('Identification details').click();
      await animalsPages.animalIdentification.heading.waitFor();
      await runA11yScan();
      await animalsPages.animalIdentification.earTag.fill('UK123456789012');
      await animalsPages.animalIdentification.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Import reason', async () => {
      await animalsPages.overview.task('Main reason for import').click();
      await animalsPages.importReason.heading.waitFor();
      await runA11yScan({ exclude: conditionalReasonRadios });
      await animalsPages.importReason.reason('Internal market').check();
      await animalsPages.importReason.purpose('Breeding').check();
      await animalsPages.importReason.saveAndContinue.click();
    });

    await test.step('Additional details', async () => {
      await animalsPages.additionalDetails.heading.waitFor();
      await runA11yScan();
      await animalsPages.additionalDetails.certifiedFor('Slaughter').check();
      await animalsPages.additionalDetails.containsUnweanedAnimals('No').check();
      await animalsPages.additionalDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Upload documents', async () => {
      await animalsPages.overview.task('Upload documents').click();
      await animalsPages.accompanyingDocuments.heading.waitFor();
      await runA11yScan();
      await animalsPages.overview.open(animalsPages.accompanyingDocuments.journeyIdFromUrl());
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Consignment addresses', async () => {
      await animalsPages.overview.task('Roles and addresses').click();
      await animalsPages.addresses.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Consignor or exporter selection', async () => {
      await animalsPages.addresses.addParty('Consignor or exporter').click();
      await animalsPages.consignorSelection.heading.waitFor();
      await runA11yScan();
      await animalsPages.consignorSelection.select('Astra Rosales');
      await animalsPages.consignorSelection.saveAndContinue.click();
      await animalsPages.addresses.heading.waitFor();
    });

    await test.step('Remaining addresses and CPH number', async () => {
      await animalsPages.addresses.addParty('Place of destination').click();
      await animalsPages.destinationSelection.select('Tech Imports Ltd');
      await animalsPages.destinationSelection.saveAndContinue.click();
      await animalsPages.addresses.heading.waitFor();
      await animalsPages.addresses.addParty('Place of origin').click();
      await animalsPages.placeOfOriginSelection.select('Origin Farm');
      await animalsPages.placeOfOriginSelection.saveAndContinue.click();
      await animalsPages.addresses.heading.waitFor();
      await animalsPages.addresses.addParty('Consignee').click();
      await animalsPages.consigneeSelection.select('British Livestock Ltd');
      await animalsPages.consigneeSelection.saveAndContinue.click();
      await animalsPages.addresses.heading.waitFor();
      await animalsPages.addresses.addParty('Importer').click();
      await animalsPages.importerSelection.select('Import Co UK');
      await animalsPages.importerSelection.saveAndContinue.click();
      await animalsPages.addresses.heading.waitFor();
      await animalsPages.addresses.continueButton.click();
    });

    await test.step('CPH number', async () => {
      await animalsPages.cphNumber.heading.waitFor();
      await runA11yScan();
      await animalsPages.cphNumber.fillCphNumber();
      await animalsPages.cphNumber.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Arrival details', async () => {
      await animalsPages.overview.task('Arrival details').click();
      await animalsPages.arrivalDetails.heading.waitFor();
      await runA11yScan();
      await journey.fillArrivalDetails();
      await animalsPages.arrivalDetails.saveAndContinue.click();
    });

    await test.step('Transited countries', async () => {
      await animalsPages.transitedCountries.heading.waitFor();
      await runA11yScan();
      await animalsPages.transitedCountries.addCountry('France');
      await animalsPages.transitedCountries.saveAndContinue.click();
    });

    await test.step('Transporter list', async () => {
      await animalsPages.transporter.heading.waitFor();
      await runA11yScan();
      await animalsPages.transporter.addTransporter.click();
    });

    await test.step('Transporter type', async () => {
      await animalsPages.transporterAdd.heading.waitFor();
      await runA11yScan();
      await animalsPages.transporterAdd.transporterType('Commercial').check();
      await animalsPages.transporterAdd.saveAndContinue.click();
    });

    await test.step('Add commercial transporter', async () => {
      await animalsPages.commercialTransporter.heading.waitFor();
      await runA11yScan();
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
    });

    await test.step('Contact address', async () => {
      await animalsPages.overview.task('Contact address for this consignment').click();
      await animalsPages.contactAddress.heading.waitFor();
      await runA11yScan();
      await animalsPages.contactAddress.address('Animal and Plant Health Agency').check();
      await animalsPages.contactAddress.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Review your notification', async () => {
      await animalsPages.overview.reviewAndSubmitButton.click();
      await animalsPages.notificationView.heading.waitFor();
      await runA11yScan();
      await animalsPages.notificationView.continueButton.click();
    });

    await test.step('Declaration', async () => {
      // Bounded rather than the full 300s a11y timeout — EUDPA-636 means this
      // never resolves right now, so fail fast instead of hanging.
      await animalsPages.declaration.heading.waitFor({ timeout: 10_000 });
      await runA11yScan();
    });
  });
});

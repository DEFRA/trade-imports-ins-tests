import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { fileUploadPaths } from '@resources/file-upload/paths';

// govuk-frontend's conditional-reveal radios set aria-expanded on the radio input
// (radios.mjs), which axe's aria-allowed-attr rule rejects — an upstream
// disagreement, not a service defect. Exclude just that input from origin scans.
const conditionalRadioInput = '#regionOfOriginCodeRequirement';

// The same upstream disagreement on the reason page, where four of the five
// reasons open a conditional reveal, so four radios carry aria-expanded.
const conditionalReasonRadios = 'input[name="reasonForImport"][aria-controls]';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.startNotification();
  });

  test('each notification journey page has no accessibility violations after user input', async ({ journey, pages, runA11yScan }) => {
    // EUDPA-636 — commercial-transporter-details.controller.js never calls
    // rememberTransporter(), so the "Add commercial transporter" step below
    // leaves the journey unable to reach Declaration. Remove this annotation
    // once the fix lands.
    test.fail(true, 'EUDPA-636');

    await test.step('Origin of import', async () => {
      await pages.overview.task('Where is this consignment coming from?').click();
      await journey.fillOriginOfImport({ requiresRegionCode: 'Yes', internalReference: 'Imports456GB' });
      await runA11yScan({ exclude: conditionalRadioInput });
      await journey.saveOriginOfImport();
      await pages.overview.heading.waitFor();
    });

    await test.step('Commodity selection', async () => {
      await pages.overview.task('What are you importing?').click();
      await pages.commoditySelection.selectSpecies(['Bos taurus']);
      await runA11yScan();
      await pages.commoditySelection.saveAndContinue.click();
    });

    await test.step('Commodity details', async () => {
      await pages.consignmentDetails.heading.waitFor();
      await pages.consignmentDetails.numberOfAnimals.fill('1');
      await pages.consignmentDetails.numberOfPackages.fill('5');
      await runA11yScan();
      await pages.consignmentDetails.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Animal identification', async () => {
      await pages.overview.task('Identification details').click();
      await pages.animalIdentification.earTag.fill('UK123456789012');
      await runA11yScan();
      await pages.animalIdentification.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Import reason', async () => {
      await pages.overview.task('Main reason for import').click();
      await pages.importReason.reason('Internal market').check();
      await pages.importReason.purpose('Breeding').check();
      await runA11yScan({ exclude: conditionalReasonRadios });
      await pages.importReason.saveAndContinue.click();
    });

    await test.step('Additional details', async () => {
      await pages.additionalDetails.heading.waitFor();
      await pages.additionalDetails.certifiedFor('Slaughter').check();
      await pages.additionalDetails.containsUnweanedAnimals('No').check();
      await runA11yScan();
      await pages.additionalDetails.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Upload documents', async () => {
      await pages.overview.task('Upload documents').click();
      await pages.accompanyingDocuments.heading.waitFor();
      await pages.accompanyingDocuments.fillDocument('InternalReference123', '03/01/2026', fileUploadPaths.safeFile1kbPdf);
      await runA11yScan();
      await pages.overview.open(pages.accompanyingDocuments.journeyIdFromUrl());
      await pages.overview.heading.waitFor();
    });

    await test.step('Consignor or exporter selection', async () => {
      await pages.overview.task('Roles and addresses').click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.addParty('Consignor or exporter').click();
      await pages.consignorSelection.select('Astra Rosales');
      await runA11yScan();
      await pages.consignorSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
    });

    await test.step('Remaining addresses', async () => {
      await pages.addresses.addParty('Place of destination').click();
      await pages.destinationSelection.select('Tech Imports Ltd');
      await pages.destinationSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.addParty('Place of origin').click();
      await pages.placeOfOriginSelection.select('Origin Farm');
      await pages.placeOfOriginSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.addParty('Consignee').click();
      await pages.consigneeSelection.select('British Livestock Ltd');
      await pages.consigneeSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
      await pages.addresses.addParty('Importer').click();
      await pages.importerSelection.select('Import Co UK');
      await pages.importerSelection.saveAndContinue.click();
      await pages.addresses.heading.waitFor();
    });

    await test.step('Consignment addresses with all parties added', async () => {
      await runA11yScan();
      await pages.addresses.continueButton.click();
    });

    await test.step('CPH number', async () => {
      await pages.cphNumber.heading.waitFor();
      await pages.cphNumber.fillCphNumber();
      await runA11yScan();
      await pages.cphNumber.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Arrival details', async () => {
      await pages.overview.task('Arrival details').click();
      await pages.arrivalDetails.heading.waitFor();
      await journey.fillArrivalDetails();
      await runA11yScan();
      await pages.arrivalDetails.saveAndContinue.click();
    });

    await test.step('Transited countries with a country added', async () => {
      await pages.transitedCountries.heading.waitFor();
      await pages.transitedCountries.addCountry('France');
      await runA11yScan();
      await pages.transitedCountries.saveAndContinue.click();
    });

    await test.step('Transporter list', async () => {
      await pages.transporter.heading.waitFor();
      await pages.transporter.transporter('García Livestock Transport SL').check();
      await runA11yScan();
      await pages.transporter.addTransporter.click();
    });

    await test.step('Transporter type', async () => {
      await pages.transporterAdd.heading.waitFor();
      await pages.transporterAdd.transporterType('Commercial').check();
      await runA11yScan();
      await pages.transporterAdd.saveAndContinue.click();
    });

    await test.step('Add commercial transporter', async () => {
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
      await runA11yScan();
      await pages.commercialTransporter.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Contact address', async () => {
      await pages.overview.task('Contact address for this consignment').click();
      await pages.contactAddress.heading.waitFor();
      await pages.contactAddress.address('Animal and Plant Health Agency').check();
      await runA11yScan();
      await pages.contactAddress.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Review your notification', async () => {
      await pages.overview.reviewAndSubmitButton.click();
      await pages.notificationView.heading.waitFor();
      await runA11yScan();
      await pages.notificationView.continueButton.click();
    });

    await test.step('Declaration', async () => {
      // Bounded rather than the full 300s a11y timeout — EUDPA-636 means this
      // never resolves right now, so fail fast instead of hanging.
      await pages.declaration.heading.waitFor({ timeout: 10_000 });
      await pages.declaration.confirmation.check();
      await runA11yScan();
      await pages.declaration.continueButton.click();
    });

    await test.step('Notification submitted', async () => {
      await pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor();
      await runA11yScan();
    });
  });
});

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
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.startNotification();
  });

  test('each notification journey page has no accessibility violations after user input', async ({
    animalsJourney,
    pages,
    animalsPages,
    runA11yScan,
  }) => {
    await test.step('Origin of import', async () => {
      await animalsPages.overview.task('Where is this consignment coming from?').click();
      await animalsJourney.fillOriginOfImport({ requiresRegionCode: 'Yes', internalReference: 'Imports456GB' });
      await runA11yScan({ exclude: conditionalRadioInput });
      await animalsJourney.saveOriginOfImport();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Commodity selection', async () => {
      await animalsPages.overview.task('What are you importing?').click();
      await animalsPages.commoditySelection.selectSpecies(['Bos taurus']);
      await runA11yScan();
      await animalsPages.commoditySelection.saveAndContinue.click();
    });

    await test.step('Commodity details', async () => {
      await animalsPages.consignmentDetails.heading.waitFor();
      await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
      await animalsPages.consignmentDetails.numberOfPackages.fill('5');
      await runA11yScan();
      await animalsPages.consignmentDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Animal identification', async () => {
      await animalsPages.overview.task('Identification details').click();
      await animalsPages.animalIdentification.earTag.fill('UK123456789012');
      await runA11yScan();
      await animalsPages.animalIdentification.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Import reason', async () => {
      await animalsPages.overview.task('Main reason for import').click();
      await animalsPages.importReason.reason('Internal market').check();
      await animalsPages.importReason.purpose('Breeding').check();
      await runA11yScan({ exclude: conditionalReasonRadios });
      await animalsPages.importReason.saveAndContinue.click();
    });

    await test.step('Additional details', async () => {
      await animalsPages.additionalDetails.heading.waitFor();
      await animalsPages.additionalDetails.certifiedFor('Slaughter').check();
      await animalsPages.additionalDetails.containsUnweanedAnimals('No').check();
      await runA11yScan();
      await animalsPages.additionalDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Upload documents', async () => {
      await animalsPages.overview.task('Upload documents').click();
      await animalsPages.accompanyingDocuments.heading.waitFor();
      await animalsPages.accompanyingDocuments.fillDocument('InternalReference123', '03/01/2026', fileUploadPaths.safeFile1kbPdf);
      await runA11yScan();
      await animalsPages.overview.open(animalsPages.accompanyingDocuments.journeyIdFromUrl());
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Consignor or exporter selection', async () => {
      await animalsPages.overview.task('Roles and addresses').click();
      await animalsPages.addresses.heading.waitFor();
      await animalsPages.addresses.addParty('Consignor or exporter').click();
      await animalsPages.consignorSelection.select('Astra Rosales');
      await runA11yScan();
      await animalsPages.consignorSelection.saveAndContinue.click();
      await animalsPages.addresses.heading.waitFor();
    });

    await test.step('Remaining addresses', async () => {
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
    });

    await test.step('Consignment addresses with all parties added', async () => {
      await runA11yScan();
      await animalsPages.addresses.continueButton.click();
    });

    await test.step('CPH number', async () => {
      await animalsPages.cphNumber.heading.waitFor();
      await animalsPages.cphNumber.fillCphNumber();
      await runA11yScan();
      await animalsPages.cphNumber.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Arrival details', async () => {
      await animalsPages.overview.task('Arrival details').click();
      await animalsPages.arrivalDetails.heading.waitFor();
      await animalsJourney.fillArrivalDetails();
      await runA11yScan();
      await animalsPages.arrivalDetails.saveAndContinue.click();
    });

    await test.step('Transited countries with a country added', async () => {
      await animalsPages.transitedCountries.heading.waitFor();
      await animalsPages.transitedCountries.addCountry('France');
      await runA11yScan();
      await animalsPages.transitedCountries.saveAndContinue.click();
    });

    await test.step('Transporter list', async () => {
      await animalsPages.transporter.heading.waitFor();
      await animalsPages.transporter.transporter('García Livestock Transport SL').check();
      await runA11yScan();
      await animalsPages.transporter.addTransporter.click();
    });

    await test.step('Transporter type', async () => {
      await animalsPages.transporterAdd.heading.waitFor();
      await animalsPages.transporterAdd.transporterType('Commercial').check();
      await runA11yScan();
      await animalsPages.transporterAdd.saveAndContinue.click();
    });

    await test.step('Add commercial transporter', async () => {
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
      await runA11yScan();
      await animalsPages.commercialTransporter.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Contact address', async () => {
      await animalsPages.overview.task('Contact address for this consignment').click();
      await animalsPages.contactAddress.heading.waitFor();
      await animalsPages.contactAddress.address('Animal and Plant Health Agency').check();
      await runA11yScan();
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
      await animalsPages.declaration.heading.waitFor();
      await animalsPages.declaration.confirmation.check();
      await runA11yScan();
      await animalsPages.declaration.continueButton.click();
    });

    await test.step('Notification submitted', async () => {
      await pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor();
      await runA11yScan();
    });
  });
});

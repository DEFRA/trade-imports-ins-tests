import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { getRelativeAppDateText } from '@utils/date-utils';

const PRIVATE_TRANSPORTER = {
  name: 'Jean Dupont',
  addressLine1: '12 Rue des Fermes',
  townOrCity: 'Amiens',
  postalOrZipCode: '80000',
  country: 'France',
  telephoneNumber: '+33 3 22 55 01 44',
  emailAddress: 'jean.dupont@example.fr',
};

// Same behaviour from the govuk-frontend npm package's radios.mjs, excluded
// elsewhere in this suite (e.g. notification-journey-filled-state.spec.ts) —
// component code we don't own, not a defect in this service.
const conditionalReasonRadios = 'input[name="reasonForImport"][aria-controls]';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the reason-gated and private transporter pages have no accessibility violations', async ({ journey, pages, runA11yScan }) => {
    test.slow();
    await journey.startNotification();
    await journey.unlockSections();

    await test.step('Import reason: Transit', async () => {
      await pages.overview.task('Main reason for import').click();
      await pages.importReason.reason('Transit').check();
      await pages.importReason.transitPortOfExit.selectOption({ index: 2 });
      await pages.importReason.transitDestinationCountry.selectOption('FR');
      await runA11yScan({ exclude: conditionalReasonRadios });
      await pages.importReason.saveAndContinue.click();
      await pages.additionalDetails.heading.waitFor();
      await pages.additionalDetails.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Import reason: Temporary admission of horses', async () => {
      await pages.overview.task('Main reason for import').click();
      await pages.importReason.reason('Temporary admission horses').check();
      await pages.importReason.temporaryAdmissionExitDate.fill(getRelativeAppDateText({ monthOffset: 2 }));
      await pages.importReason.temporaryAdmissionPortOfExit.selectOption({ index: 2 });
      await runA11yScan({ exclude: conditionalReasonRadios });
      await pages.importReason.saveAndContinue.click();
      await pages.additionalDetails.heading.waitFor();
      await pages.additionalDetails.saveAndContinue.click();
      await pages.overview.heading.waitFor();
    });

    await test.step('Private transporter', async () => {
      await journey.reachTransporterFromHub();
      await pages.transporter.addTransporter.click();
      await pages.transporterAdd.heading.waitFor();
      await pages.transporterAdd.transporterType('Private').check();
      await runA11yScan();
      await pages.transporterAdd.saveAndContinue.click();
      await pages.privateTransporter.heading.waitFor();
      await pages.privateTransporter.fill(PRIVATE_TRANSPORTER);
      await runA11yScan();
    });
  });

  test('the approved commercial transporter register has no accessibility violations', async ({ journey, runA11yScan }) => {
    test.slow();
    // Nothing links here now that the add route's commercial arm is the
    // add-commercial form (see journey.ts), so no other page reaches it.
    await journey.toTransporterSelection();
    await runA11yScan();
  });
});

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
  test('the reason-gated and private transporter pages have no accessibility violations', async ({
    animalsJourney,
    animalsPages,
    runA11yScan,
  }) => {
    test.slow();
    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    await test.step('Import reason: Transit', async () => {
      await animalsPages.overview.task('Main reason for import').click();
      await animalsPages.importReason.reason('Transit').check();
      await animalsPages.importReason.selectTransitPortOfExitByIndex(2);
      await animalsPages.importReason.selectTransitDestinationCountry('FR');
      await runA11yScan({ exclude: conditionalReasonRadios });
      await animalsPages.importReason.saveAndContinue.click();
      await animalsPages.additionalDetails.heading.waitFor();
      await animalsPages.additionalDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Import reason: Temporary admission of horses', async () => {
      await animalsPages.overview.task('Main reason for import').click();
      await animalsPages.importReason.reason('Temporary admission horses').check();
      await animalsPages.importReason.temporaryAdmissionExitDate.fill(getRelativeAppDateText({ monthOffset: 2 }));
      await animalsPages.importReason.selectTemporaryAdmissionPortOfExitByIndex(2);
      await runA11yScan({ exclude: conditionalReasonRadios });
      await animalsPages.importReason.saveAndContinue.click();
      await animalsPages.additionalDetails.heading.waitFor();
      await animalsPages.additionalDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Private transporter', async () => {
      await animalsJourney.reachTransporterFromHub();
      await animalsPages.transporter.addTransporter.click();
      await animalsPages.transporterAdd.heading.waitFor();
      await animalsPages.transporterAdd.transporterType('Private').check();
      await runA11yScan();
      await animalsPages.transporterAdd.saveAndContinue.click();
      await animalsPages.privateTransporter.heading.waitFor();
      await animalsPages.privateTransporter.fill(PRIVATE_TRANSPORTER);
      await runA11yScan();
    });
  });

  test('the approved commercial transporter register has no accessibility violations', async ({ animalsJourney, runA11yScan }) => {
    test.slow();
    // Nothing links here now that the add route's commercial arm is the
    // add-commercial form (see journey.ts), so no other page reaches it.
    await animalsJourney.toTransporterSelection();
    await runA11yScan();
  });
});

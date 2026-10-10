import { test, expect } from '@fixtures';
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

test.describe('Security scan (frontend, conditional pages)', { tag: '@active' }, () => {
  test('routes the reason-gated and transporter-gated pages through the ZAP proxy', async ({ animalsJourney, animalsPages }) => {
    test.slow();
    // Two reveal payloads the submission journey never sends, because its
    // answers put them out of scope. Two reasons are needed, not one: transit
    // reveals the port of exit and the destination country, and the temporary
    // admission of horses reveals the exit date and the port of exit.
    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    await animalsPages.overview.task('Main reason for import').click();
    await animalsPages.importReason.reason('Transit').check();
    await animalsPages.importReason.transitPortOfExit.selectOption({ index: 2 });
    await animalsPages.importReason.transitDestinationCountry.selectOption('FR');
    await animalsPages.importReason.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();
    await animalsPages.overview.task('Additional details').click();
    await animalsPages.additionalDetails.heading.waitFor();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();

    await animalsPages.overview.task('Main reason for import').click();
    await animalsPages.importReason.reason('Temporary admission horses').check();
    await animalsPages.importReason.temporaryAdmissionExitDate.fill(getRelativeAppDateText({ monthOffset: 2 }));
    await animalsPages.importReason.temporaryAdmissionPortOfExit.selectOption({ index: 2 });
    await animalsPages.importReason.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();
    await animalsPages.overview.task('Additional details').click();
    await animalsPages.additionalDetails.heading.waitFor();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();

    // The private branch of the add route; the submission journey only ever
    // takes the commercial one.
    await animalsJourney.reachTransporterFromHub();
    await animalsPages.transporter.addTransporter.click();
    await animalsPages.transporterAdd.heading.waitFor();
    await animalsPages.transporterAdd.transporterType('Private').check();
    await animalsPages.transporterAdd.saveAndContinue.click();

    await expect(animalsPages.privateTransporter.heading).toBeVisible();
    await animalsPages.privateTransporter.fill(PRIVATE_TRANSPORTER);
    await animalsPages.privateTransporter.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
  });
});

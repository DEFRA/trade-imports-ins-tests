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
  test('routes the reason-gated and transporter-gated pages through the ZAP proxy', async ({ journey, pages }) => {
    test.slow();
    // Two reveal payloads the submission journey never sends, because its
    // answers put them out of scope. Two reasons are needed, not one: transit
    // reveals the port of exit and the destination country, and the temporary
    // admission of horses reveals the exit date and the port of exit.
    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Main reason for import').click();
    await pages.importReason.reason('Transit').check();
    await pages.importReason.transitPortOfExit.selectOption({ index: 2 });
    await pages.importReason.transitDestinationCountry.selectOption('FR');
    await pages.importReason.saveAndContinue.click();
    await pages.additionalDetails.heading.waitFor();
    await pages.additionalDetails.saveAndContinue.click();
    await pages.overview.heading.waitFor();

    await pages.overview.task('Main reason for import').click();
    await pages.importReason.reason('Temporary admission horses').check();
    await pages.importReason.temporaryAdmissionExitDate.fill(getRelativeAppDateText({ monthOffset: 2 }));
    await pages.importReason.temporaryAdmissionPortOfExit.selectOption({ index: 2 });
    await pages.importReason.saveAndContinue.click();
    await pages.additionalDetails.heading.waitFor();
    await pages.additionalDetails.saveAndContinue.click();
    await pages.overview.heading.waitFor();

    // The private branch of the add route; the submission journey only ever
    // takes the commercial one.
    await journey.reachTransporterFromHub();
    await pages.transporter.addTransporter.click();
    await pages.transporterAdd.heading.waitFor();
    await pages.transporterAdd.transporterType('Private').check();
    await pages.transporterAdd.saveAndContinue.click();

    await expect(pages.privateTransporter.heading).toBeVisible();
    await pages.privateTransporter.fill(PRIVATE_TRANSPORTER);
    await pages.privateTransporter.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
  });
});

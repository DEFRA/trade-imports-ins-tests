import { test, expect } from '@fixtures';
import { IMPORT_REASON_TASK } from '@domain/animals/constants/import-reason-page';
import { getRelativeAppDateText } from '@utils/date-utils';
import { handTypedPrivateTransporter } from '@domain/animals/constants/transporters';

const PRIVATE_TRANSPORTER = handTypedPrivateTransporter('Jean Dupont');

test.describe('Security scan (frontend, conditional pages)', { tag: '@active' }, () => {
  test('routes the reason-gated and transporter-gated pages through the ZAP proxy', async ({ animalsJourney, animalsPages }) => {
    test.slow();
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Transit').check();
    await animalsPages.importReason.selectTransitPortOfExitByIndex(2);
    await animalsPages.importReason.selectTransitDestinationCountry('FR');
    await animalsPages.importReason.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();
    await animalsPages.overview.task('Additional details').click();
    await animalsPages.additionalDetails.heading.waitFor();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();

    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Temporary admission horses').check();
    await animalsPages.importReason.temporaryAdmissionExitDate.fill(getRelativeAppDateText({ monthOffset: 2 }));
    await animalsPages.importReason.selectTemporaryAdmissionPortOfExitByIndex(2);
    await animalsPages.importReason.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();
    await animalsPages.overview.task('Additional details').click();
    await animalsPages.additionalDetails.heading.waitFor();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();

    await animalsJourney.reachTransporterFromHub();
    await animalsPages.transporter.addTransporter.click();
    await animalsPages.transporterAdd.heading.waitFor();
    await animalsPages.transporterAdd.transporterType('Private').check();
    await animalsPages.transporterAdd.continueButton.click();

    await expect(animalsPages.privateTransporter.heading).toBeVisible();
    await animalsPages.privateTransporter.fill(PRIVATE_TRANSPORTER);
    await animalsPages.privateTransporter.saveAndContinue.click();
    await expect(animalsPages.transporter.heading).toBeVisible();
  });
});

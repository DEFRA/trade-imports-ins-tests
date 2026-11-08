import { test, expect } from '@fixtures';
import { handTypedCommercialTransporter } from '@domain/animals/constants/transporters';

test.describe('Commercial transporter scope', { tag: '@duplicated-in-frontend' }, () => {
  test('commercial transporter is owed only for the commercial type and is wiped when the type changes', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    await animalsJourney.reachTransporterFromHub();
    await animalsJourney.chooseTransporterType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(animalsPages.commercialTransporter.country).toHaveValue('Northern Ireland');
    await animalsJourney.fillAndSaveCommercialTransporterAddFormToOverview(handTypedCommercialTransporter);

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(animalsPages.commercialTransporter.approvalNumber).toHaveValue(handTypedCommercialTransporter.approvalNumber);
    await expect(animalsPages.commercialTransporter.nameOrOrganisationName).toHaveValue(handTypedCommercialTransporter.name);
    await animalsPages.commercialTransporter.saveAndContinue.click();
    await expect(animalsPages.transporter.heading).toBeVisible();
    await animalsPages.transporter.saveAndContinue.click();

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Private');
    await expect(animalsPages.privateTransporter.heading).toBeVisible();
    await animalsPages.privateTransporter.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(animalsPages.commercialTransporter.approvalNumber).toHaveValue('');
    await expect(animalsPages.commercialTransporter.nameOrOrganisationName).toHaveValue('');
  });
});

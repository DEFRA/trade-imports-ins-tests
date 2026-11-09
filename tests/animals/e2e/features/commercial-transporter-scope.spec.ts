import { test, expect } from '@fixtures';
import { handTypedCommercialTransporter, handTypedPrivateTransporter } from '@domain/animals/constants/transporters';
import { trackTransporterForDeletion, transporterIdsDeletedAfterEachTest } from '@utils/transporter-cleanup';

test.describe('Commercial transporter scope', { tag: '@duplicated-in-frontend' }, () => {
  const createdTransporterIds = transporterIdsDeletedAfterEachTest();

  test('commercial transporter is owed only for the commercial type and is wiped when the type changes', async ({
    animalsJourney,
    animalsPages,
    addressBookApi,
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
    await animalsJourney.saveTransporterDetailsToOverview(animalsPages.commercialTransporter);

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Private');
    await expect(animalsPages.privateTransporter.heading).toBeVisible();
    const privateTransporterName = `Commercial scope private transporter ${Date.now()}`;
    await animalsJourney.fillAndSavePrivateTransporterAddForm(handTypedPrivateTransporter(privateTransporterName));
    await trackTransporterForDeletion(addressBookApi, privateTransporterName, createdTransporterIds);
    await expect(animalsPages.transporter.heading).toBeVisible();
    await animalsPages.transporter.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(animalsPages.commercialTransporter.approvalNumber).toHaveValue('');
    await expect(animalsPages.commercialTransporter.nameOrOrganisationName).toHaveValue('');
  });
});

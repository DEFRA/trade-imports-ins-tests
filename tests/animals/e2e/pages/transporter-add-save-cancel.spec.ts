import { test, expect } from '@fixtures';
import { trackTransporterForDeletion, transporterIdsDeletedAfterEachTest } from '@utils/transporter-cleanup';
import { handTypedPrivateTransporter, transporters } from '@domain/animals/constants/transporters';

test.describe('Saving and cancelling a transporter add form', () => {
  const createdTransporterIds = transporterIdsDeletedAfterEachTest();

  test('a complete save returns to the list with the new transporter first and checked, under a one-time success banner, and persists it for the organisation', async ({
    animalsJourney,
    animalsPages,
    addressBookApi,
  }) => {
    await animalsJourney.toTransporter();
    const namesBeforeAdding = await animalsPages.transporter.listedTransporterNames.allTextContents();
    const referenceNumber = animalsPages.transporter.referenceNumberFromUrl();

    await animalsJourney.chooseTransporterType('Private');
    await animalsPages.privateTransporter.heading.waitFor();
    const name = `Saved private transporter ${Date.now()}`;
    await animalsJourney.fillAndSavePrivateTransporterAddForm(handTypedPrivateTransporter(name));
    await trackTransporterForDeletion(addressBookApi, name, createdTransporterIds);

    await expect(animalsPages.transporter.heading).toBeVisible();
    await expect(animalsPages.transporter.successBanner).toContainText(`${name} transporter added`);
    const namesAfterAdding = await animalsPages.transporter.listedTransporterNames.allTextContents();
    expect(namesAfterAdding[0]).toBe(name);
    expect(namesAfterAdding.slice(1)).toEqual(expect.arrayContaining(namesBeforeAdding));
    await expect(animalsPages.transporter.transporter(name)).toBeChecked();

    await animalsPages.transporter.open(referenceNumber);
    await expect(animalsPages.transporter.successBanner).toHaveCount(0);
  });

  test('cancelling with the stored type kept leaves the chosen transporter alone, adds nothing and shows no error', async ({
    animalsJourney,
    animalsPages,
    addressBookApi,
  }) => {
    const chosen = transporters.garciaLivestockTransport.display;
    const typedName = `Abandoned Commercial Transporter ${Date.now()}`;

    await animalsJourney.toTransporter();
    await animalsPages.transporter.transporter(chosen).check();
    await animalsPages.transporter.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Transport details').click();
    const referenceNumber = animalsPages.transporter.referenceNumberFromUrl();
    await animalsJourney.chooseTransporterType('Commercial');
    await animalsPages.commercialTransporter.heading.waitFor();
    await animalsPages.commercialTransporter.nameOrOrganisationName.fill(typedName);
    await animalsPages.commercialTransporter.cancelAndReturnToDashboard.click();

    await expect(animalsPages.dashboard.heading).toBeVisible();
    await expect(animalsPages.dashboard.errorSummary).toHaveCount(0);
    expect(await addressBookApi.listTransporters(typedName)).toEqual([]);

    await animalsPages.transporter.open(referenceNumber);
    await expect(animalsPages.transporter.transporter(chosen)).toBeChecked();
  });
});

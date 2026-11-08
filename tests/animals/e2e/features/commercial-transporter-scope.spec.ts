import { test, expect } from '@fixtures';
import { handTypedCommercialTransporter } from '@domain/animals/constants/transporters';
import { transporterIdsDeletedAfterEachTest } from '@utils/transporter-cleanup';

test.describe('Commercial transporter scope', { tag: '@duplicated-in-frontend' }, () => {
  const createdTransporterIds = transporterIdsDeletedAfterEachTest();

  test('commercial transporter is owed only for the commercial type and is wiped when the type changes; the form opens under its own browser title, offers the authorisation guidance in a banner titled "Important", labels its postcode field "Postcode or Zip code" and refuses a wholly blank save naming every required field', async ({
    animalsJourney,
    animalsPages,
    pages,
    addressBookApi,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    await animalsJourney.reachTransporterFromHub();
    await animalsJourney.chooseTransporterType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(pages.page).toHaveTitle('Add a commercial transporter - Import notification service - GOV.UK');
    await expect(animalsPages.commercialTransporter.country).toHaveValue('Northern Ireland');
    await expect(animalsPages.commercialTransporter.postcode).toHaveAccessibleName('Postcode or Zip code');

    const banner = animalsPages.commercialTransporter.importantBanner;
    await expect(banner.getByRole('heading', { name: 'Help with transporter authorisation' })).toBeVisible();

    await animalsPages.commercialTransporter.saveAndContinue.click();
    await expect(animalsPages.commercialTransporter.errorSummary).toBeVisible();
    await expect(animalsPages.commercialTransporter.errorSummaryLinks).toHaveText([
      'Enter a transporter authorisation number',
      'Enter a name or organisation name',
      'Enter address line 1',
      'Enter a town or city',
      'Enter a postcode or Zip code',
      'Enter an email address',
      'Enter a phone number',
    ]);

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
    await animalsJourney.savePrivateTransporterTrackedForDeletion(
      addressBookApi,
      'Commercial scope private transporter',
      createdTransporterIds,
    );
    await expect(animalsPages.transporter.heading).toBeVisible();
    await animalsPages.transporter.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(animalsPages.commercialTransporter.approvalNumber).toHaveValue('');
    await expect(animalsPages.commercialTransporter.nameOrOrganisationName).toHaveValue('');
  });
});

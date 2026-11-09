import { test, expect } from '@fixtures';

test.describe('Commercial transporter form', { tag: '@duplicated-in-frontend' }, () => {
  test('opens under its own browser title', async ({ animalsJourney, pages }) => {
    await animalsJourney.toCommercialTransporter();

    await expect(pages.page).toHaveTitle('Add a commercial transporter - Import notification service - GOV.UK');
  });

  test('shows the authorisation guidance banner', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toCommercialTransporter();

    const banner = animalsPages.commercialTransporter.importantBanner;
    await expect(banner.getByRole('heading', { name: 'Help with transporter authorisation' })).toBeVisible();
  });

  test('labels its postcode field', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toCommercialTransporter();

    await expect(animalsPages.commercialTransporter.postcode).toHaveAccessibleName('Postcode or Zip code');
  });

  test('a wholly blank save names every required field', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toCommercialTransporter();

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
  });
});

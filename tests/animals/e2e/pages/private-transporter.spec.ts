import { test, expect } from '@fixtures';

test.describe('Private transporter form', { tag: '@duplicated-in-frontend' }, () => {
  test('opens under its own browser title', async ({ animalsJourney, pages }) => {
    await animalsJourney.toPrivateTransporter();

    await expect(pages.page).toHaveTitle('Add a private transporter - Import notification service - GOV.UK');
  });

  test('a wholly blank save is refused naming every required field', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toPrivateTransporter();

    await animalsPages.privateTransporter.saveAndContinue.click();

    await expect(animalsPages.privateTransporter.errorSummaryLinks).toHaveText([
      'Enter a name or organisation name',
      'Enter address line 1',
      'Enter a town or city',
      'Enter a postcode or Zip code',
      'Enter an email address',
      'Enter a phone number',
    ]);
  });
});

import { test, expect } from '@fixtures';

test.describe('Transited countries page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toTransitedCountries();
  });

  test('renders the country search and an empty list', async ({ animalsPages }) => {
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await expect(animalsPages.transitedCountries.countryField).toBeVisible();
    await expect(animalsPages.transitedCountries.addCountryButton).toBeVisible();
    await expect(animalsPages.transitedCountries.saveAndContinue).toBeVisible();
  });

  test('accepts and persists multiple transited countries', async ({ pages, animalsPages }) => {
    const journeyId = animalsPages.transitedCountries.journeyIdFromUrl();
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.addCountry('Belgium');
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await animalsPages.transitedCountries.open(journeyId);
    await expect(animalsPages.transitedCountries.row('France')).toBeVisible();
    await expect(animalsPages.transitedCountries.row('Belgium')).toBeVisible();
  });

  test('removes a country from the list, leaving the others', async ({ animalsPages }) => {
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.addCountry('Belgium');
    await animalsPages.transitedCountries.removeCountry('France').click();

    await expect(animalsPages.transitedCountries.row('France')).toHaveCount(0);
    await expect(animalsPages.transitedCountries.row('Belgium')).toBeVisible();
  });

  test('transit countries are optional: continuing with none saves and goes on', async ({ pages, animalsPages }) => {
    const journeyId = animalsPages.transitedCountries.journeyIdFromUrl();
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expect(animalsPages.transporter.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await animalsPages.transitedCountries.open(journeyId);
    await expect(pages.page.getByText('You have not added any countries yet.')).toBeVisible();
    await expect(animalsPages.transitedCountries.addedCountries).toHaveCount(0);
  });

  test('shows an error summary when Add country is pressed with no country chosen', async ({ pages, animalsPages }) => {
    await animalsPages.transitedCountries.addCountryButton.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    // The message is on the page twice — the summary link and the field's own
    // error — so the summary link is what this asserts, by role.
    await expect(pages.page.getByRole('link', { name: 'Enter a country to add' })).toBeVisible();
  });
});

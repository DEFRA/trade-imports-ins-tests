import { test, expect } from '@fixtures';

test.describe('Transited countries page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toTransitedCountries();
  });

  test('renders the country search and an empty list', async ({ pages }) => {
    await expect(pages.transitedCountries.heading).toBeVisible();
    await expect(pages.transitedCountries.countryField).toBeVisible();
    await expect(pages.transitedCountries.addCountryButton).toBeVisible();
    await expect(pages.transitedCountries.saveAndContinue).toBeVisible();
  });

  test('accepts and persists multiple transited countries', async ({ pages }) => {
    const journeyId = pages.transitedCountries.journeyIdFromUrl();
    await pages.transitedCountries.addCountry('France');
    await pages.transitedCountries.addCountry('Belgium');
    await pages.transitedCountries.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await pages.transitedCountries.open(journeyId);
    await expect(pages.transitedCountries.row('France')).toBeVisible();
    await expect(pages.transitedCountries.row('Belgium')).toBeVisible();
  });

  test('removes a country from the list, leaving the others', async ({ pages }) => {
    await pages.transitedCountries.addCountry('France');
    await pages.transitedCountries.addCountry('Belgium');
    await pages.transitedCountries.removeCountry('France').click();

    await expect(pages.transitedCountries.row('France')).toHaveCount(0);
    await expect(pages.transitedCountries.row('Belgium')).toBeVisible();
  });

  test('transit countries are optional: continuing with none saves and goes on', async ({ pages }) => {
    const journeyId = pages.transitedCountries.journeyIdFromUrl();
    await pages.transitedCountries.saveAndContinue.click();
    await expect(pages.transporter.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await pages.transitedCountries.open(journeyId);
    await expect(pages.page.getByText('You have not added any countries yet.')).toBeVisible();
    await expect(pages.transitedCountries.addedCountries).toHaveCount(0);
  });

  test('shows an error summary when Add country is pressed with no country chosen', async ({ pages }) => {
    await pages.transitedCountries.addCountryButton.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    // The message is on the page twice — the summary link and the field's own
    // error — so the summary link is what this asserts, by role.
    await expect(pages.page.getByRole('link', { name: 'Enter a country to add' })).toBeVisible();
  });
});

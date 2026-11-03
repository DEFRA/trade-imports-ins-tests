import { test, expect } from '@fixtures';
import { TRANSIT_COUNTRY_SEARCH_PLACEHOLDER, TRANSIT_COUNTRY_SELECT_TEXT } from '@domain/animals/constants/transit-countries-page';
import { countriesOrigin } from '@resources/reference-data/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { expectEmptyTransitList } from '@utils/transit-countries-assertions';

test.describe('Transited countries page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toTransitedCountries();
  });

  test('renders the country search with only the intro paragraphs, the cancel link and the three buttons', async ({ animalsPages }) => {
    const { transitedCountries } = animalsPages;

    await expect(transitedCountries.heading).toBeVisible();
    await expect(transitedCountries.country.field).toBeVisible();
    await expectEmptyTransitList(transitedCountries);
  });

  test('the empty search box reads "Search for a country"', async ({ animalsPages }) => {
    await expect(animalsPages.transitedCountries.country.field).toHaveAttribute('placeholder', TRANSIT_COUNTRY_SEARCH_PLACEHOLDER);
    await expect(animalsPages.transitedCountries.country.field).toHaveAccessibleName('Enter a country');
  });

  test('adding France lists its row and announces it', async ({ animalsPages }) => {
    const { transitedCountries } = animalsPages;

    await transitedCountries.addCountry('France');

    await expect(transitedCountries.addedCountryNames).toHaveText(['France']);
    await expect(transitedCountries.statusRegion).toHaveText('France added.');
  });

  test('accepts and persists multiple transited countries', async ({ pages, animalsPages }) => {
    const referenceNumber = animalsPages.transitedCountries.referenceNumberFromUrl();
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.addCountry('Belgium');
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await animalsPages.transitedCountries.open(referenceNumber);
    await expect(animalsPages.transitedCountries.addedCountryNames).toHaveText(['France', 'Belgium']);
  });

  test('removes a country from the list, leaving the others', async ({ animalsPages }) => {
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.addCountry('Belgium');
    await animalsPages.transitedCountries.removeCountry('France').click();

    await expect(animalsPages.transitedCountries.addedCountryNames).toHaveText(['Belgium']);
  });

  test('transit countries are optional: continuing with none saves and returns to the overview', async ({ pages, animalsPages }) => {
    const referenceNumber = animalsPages.transitedCountries.referenceNumberFromUrl();
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await animalsPages.transitedCountries.open(referenceNumber);
    await expectEmptyTransitList(animalsPages.transitedCountries);
    await expect(animalsPages.transitedCountries.addedCountryNames).toHaveText([]);
  });

  test('shows an error summary when Add country is pressed with no country chosen', async ({ pages, animalsPages }) => {
    await animalsPages.transitedCountries.addCountryButton.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Enter a country to add' })).toBeVisible();
  });
});

test.describe('Transited countries page without JavaScript', { tag: '@duplicated-in-frontend' }, () => {
  test.use({ javaScriptEnabled: false });

  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toTransitedCountries();
  });

  test('the select opens on "Select a country" followed by every origin country', async ({ animalsPages }) => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");

    await expect(animalsPages.transitedCountries.country.options).toHaveText([
      TRANSIT_COUNTRY_SELECT_TEXT,
      ...countriesOrigin.map(({ name }) => name),
    ]);
  });

  test('choosing France and pressing Add country lists it', async ({ animalsPages }) => {
    await animalsPages.transitedCountries.addCountry('France');

    await expect(animalsPages.transitedCountries.addedCountryNames).toHaveText(['France']);
  });
});

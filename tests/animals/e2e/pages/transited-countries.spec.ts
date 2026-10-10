import type { Page } from '@playwright/test';
import { SET_BASES } from '@page-objects/shared/sets';
import type { AnimalsTransitedCountriesPage } from '@page-objects/animals/transited-countries-page';
import { test, expect } from '@fixtures';

const TRANSIT_BROWSER_TITLE = 'Transit countries - Import notification service - GOV.UK';

test.describe('Transited countries page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toTransitedCountries();
  });

  test('renders the country search and an empty list', async ({ animalsPages }) => {
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await expect(animalsPages.transitedCountries.countryField).toBeVisible();
    await expect(animalsPages.transitedCountries.addCountryButton).toBeVisible();
    await expect(animalsPages.transitedCountries.saveAndContinue).toBeVisible();
    await expect(animalsPages.transitedCountries.addedCountriesTable).toHaveCount(0);
    await expect(animalsPages.transitedCountries.emptyListSentence).toHaveCount(0);
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

  test('transit countries are optional: continuing with none saves and returns to the overview', async ({ pages, animalsPages }) => {
    const journeyId = animalsPages.transitedCountries.journeyIdFromUrl();
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await animalsPages.transitedCountries.open(journeyId);
    await expect(animalsPages.transitedCountries.emptyListSentence).toHaveCount(0);
    await expect(animalsPages.transitedCountries.addedCountries).toHaveCount(0);
  });

  test('shows an error summary when Add country is pressed with no country chosen', async ({ pages, animalsPages }) => {
    await animalsPages.transitedCountries.addCountryButton.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    // The message is on the page twice — the summary link and the field's own
    // error — so the summary link is what this asserts, by role.
    await expect(pages.page.getByRole('link', { name: 'Enter a country to add' })).toBeVisible();
  });

  test('titles the browser tab Transit countries, with Error: in front when the page shows an error', async ({ pages, animalsPages }) => {
    await expect(pages.page).toHaveTitle(TRANSIT_BROWSER_TITLE);

    await animalsPages.transitedCountries.addCountryButton.click();

    await expect(pages.page).toHaveTitle(`Error: ${TRANSIT_BROWSER_TITLE}`);
  });

  test('back link goes to the overview when the page was opened from its task', async ({ animalsPages }) => {
    const journeyId = animalsPages.transitedCountries.journeyIdFromUrl();
    await expect(animalsPages.transitedCountries.linkBack).toHaveAttribute('href', new RegExp(`/notifications/${journeyId}$`));

    await animalsPages.transitedCountries.linkBack.click();

    await expect(animalsPages.overview.heading).toBeVisible();
  });
});

const addTerritoryAndReopen = async (page: Page, transited: AnimalsTransitedCountriesPage) => {
  const journeyId = transited.journeyIdFromUrl();
  const territory = transited.territoryOptions.first();
  const code = await territory.getAttribute('value');
  const name = (await territory.textContent())?.trim() ?? '';
  expect(name).toMatch(/^.+ \(.+\)$/);

  await transited.addCountry(name);
  await expect(transited.addedCountryCodes).toHaveValue(code ?? '');
  await transited.saveAndContinue.click();
  await expect(page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

  await transited.open(journeyId);
  await expect(transited.row(name)).toBeVisible();
};

test.describe('Transited countries page — territories', { tag: ['@integration'] }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toTransitedCountries();
  });

  test('a territory is listed as "<territory> (<country>)", saved by its code, and listed again under that name when the page is reopened', async ({
    pages,
    animalsPages,
  }) => {
    await addTerritoryAndReopen(pages.page, animalsPages.transitedCountries);
  });
});

test.describe('Transited countries page — territories without JavaScript', { tag: ['@integration'] }, () => {
  test.use({ javaScriptEnabled: false });

  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toTransitedCountries();
  });

  test('without JavaScript, a territory is listed as "<territory> (<country>)", saved by its code, and listed again under that name', async ({
    pages,
    animalsPages,
  }) => {
    await addTerritoryAndReopen(pages.page, animalsPages.transitedCountries);
  });
});

test.describe('Transited countries page — how it is reached', { tag: ['@integration'] }, () => {
  test('back link goes to arrival details when the page was reached by Save and continue on arrival details', async ({
    animalsJourney,
    animalsPages,
  }) => {
    const journeyId = await animalsJourney.walkOpeningRunToArrivalDetails();
    await animalsPages.arrivalDetails.meansOfTransport.selectOption({ label: 'Road' });

    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await expect(animalsPages.transitedCountries.linkBack).toHaveAttribute(
      'href',
      new RegExp(`/notifications/${journeyId}/port-of-entry$`),
    );
    await animalsPages.transitedCountries.linkBack.click();
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
  });

  test('opening the page by its address goes to the overview when the means of transport is not saved, Air or Sea', async ({
    pages,
    animalsJourney,
    animalsPages,
  }) => {
    const journeyId = await animalsJourney.startNotification();
    await animalsJourney.unlockSections();
    const overviewUrl = new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyId}$`);

    await animalsPages.transitedCountries.open(journeyId);
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(pages.page).toHaveURL(overviewUrl);

    for (const label of ['Air', 'Sea']) {
      await animalsPages.overview.task('Arrival details').click();
      await animalsPages.arrivalDetails.meansOfTransport.selectOption({ label });
      await animalsPages.arrivalDetails.saveAndContinue.click();
      await expect(animalsPages.overview.heading).toBeVisible();

      await animalsPages.transitedCountries.open(journeyId);
      await expect(animalsPages.overview.heading).toBeVisible();
      await expect(pages.page).toHaveURL(overviewUrl);
    }
  });
});

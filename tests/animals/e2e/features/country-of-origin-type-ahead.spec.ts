import { test, expect } from '@fixtures';
import { countryAndSubdivisionNamesWithCountry, namesContaining } from '@resources/reference-data/reference-data';
import { ORIGIN_COUNTRY_SEARCH_PLACEHOLDER, ORIGIN_COUNTRY_SELECT_TEXT } from '@domain/animals/constants/origin-page';
import { SEARCH_BOX_ASSISTIVE_DESCRIPTION } from '@domain/shared/constants/type-ahead';
import {
  expectFirstOptionAnnounced,
  expectResultCountAnnounced,
  expectSearchButtonHiddenAndInert,
  expectSearchButtonStyledAsGovukBlue,
} from '@page-objects/shared/type-ahead-checks';

test.describe('Country of origin type-ahead', { tag: '@duplicated-in-frontend' }, () => {
  test(
    'filters as you type, submits the country code and persists it',
    { tag: '@cross-browser' },
    async ({ animalsJourney, animalsPages }) => {
      await animalsJourney.toOriginFromOverview();

      const field = animalsPages.originOfImport.country.field;
      await expect(field).toBeVisible();
      await expect(field).toHaveRole('combobox');
      await expect(field).toHaveAccessibleName('Country of origin');

      const fallback = animalsPages.originOfImport.country.select;
      await expect(fallback.locator('option').first()).toHaveText(ORIGIN_COUNTRY_SELECT_TEXT);
      await expect(fallback.locator('option')).toHaveCount(countryAndSubdivisionNamesWithCountry().length + 1);

      await animalsPages.originOfImport.country.search('Belg');
      await expect(animalsPages.originOfImport.country.option('Belgium')).toBeVisible();

      await animalsPages.originOfImport.country.choose('Belgium');
      await expect(field).toHaveValue('Belgium');
      await expect(fallback).toHaveValue('BE');

      await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
      await animalsPages.originOfImport.saveAndContinue.click();
      await expect(animalsPages.overview.heading).toBeVisible();

      await animalsJourney.openOriginFromOverview();
      await expect(fallback).toHaveValue('BE');
      await expect(animalsPages.originOfImport.country.field).toHaveValue('Belgium');
    },
  );

  test('describes the search box with the assistive hint and shows its placeholder and no hint', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toOriginFromOverview();

    await expect(animalsPages.originOfImport.country.field).toHaveAttribute('placeholder', ORIGIN_COUNTRY_SEARCH_PLACEHOLDER);
    await expect(animalsPages.originOfImport.country.field).toHaveAccessibleDescription(SEARCH_BOX_ASSISTIVE_DESCRIPTION);
    await expect(animalsPages.originOfImport.country.hint).toHaveCount(0);
  });

  test('shows the letters typed in bold in a country suggestion', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toOriginFromOverview();

    await animalsPages.originOfImport.country.search('fra');

    await expect(animalsPages.originOfImport.country.boldLettersOf('France')).toHaveText(['Fra']);
  });

  test('keeps the search button out of assistive technology and the tab order, and focuses the box when it is clicked', async ({
    pages,
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toOriginFromOverview();

    await expectSearchButtonHiddenAndInert(pages.page, animalsPages.originOfImport.country);
  });
});

test.describe('Country of origin type-ahead search button and announcements', () => {
  const typed = 'Belg';
  const offered = namesContaining(countryAndSubdivisionNamesWithCountry(), typed);

  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toOriginFromOverview();
  });

  test('shows a GOV.UK blue search button with a white magnifying glass icon', async ({ animalsPages }) => {
    await expectSearchButtonStyledAsGovukBlue(animalsPages.originOfImport.country);
  });

  test('announces the number of results after typing', async ({ animalsPages }) => {
    await expectResultCountAnnounced(animalsPages.originOfImport.country, typed, offered);
  });

  test('announces the highlighted country after moving onto its suggestion', async ({ animalsPages }) => {
    await expectFirstOptionAnnounced(animalsPages.originOfImport.country, typed, offered);
  });
});

test.describe('Country of origin without JavaScript', { tag: '@duplicated-in-frontend' }, () => {
  test.use({ javaScriptEnabled: false });

  test('shows no hint, begins with Select a country, and saves the chosen country', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toOriginFromOverview();
    const referenceNumber = animalsPages.originOfImport.referenceNumberFromUrl();
    const { country } = animalsPages.originOfImport;
    const { select } = country;

    await expect(country.field).toHaveAccessibleDescription('');
    await expect(country.hint).toHaveCount(0);
    await expect(select.locator('option').first()).toHaveText(ORIGIN_COUNTRY_SELECT_TEXT);

    await select.selectOption({ label: 'Belgium' });
    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.saveAndContinue.click();

    await animalsPages.originOfImport.open(referenceNumber);
    await expect(select).toHaveValue('BE');
  });
});

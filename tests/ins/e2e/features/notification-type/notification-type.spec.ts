import { type Page } from '@playwright/test';
import { requireBaseUrl } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';

import { test, expect } from '@fixtures';

const GBN_AG = /GBN-AG-\d{2}-[0-9A-HJKMNP-TV-Z]{6}/;
const PLANTS_REFERENCE = /^GBN-HRP-\d{2}-[0-9A-HJ-KM-NP-TV-Z]{6}$/;

const OPTION_VALUES = ['live-animals', 'germinal-products', 'plants-for-planting', 'potatoes', 'wood-products'];

/** Collects the URLs the page requests from one service, so a test can show a service was never called. */
function requestsTo(page: Page, baseUrlEnv: 'TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL' | 'TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL'): URL[] {
  const origin = new URL(requireBaseUrl(baseUrlEnv)).origin;
  const urls: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin === origin) urls.push(url);
  });
  return urls;
}

test.describe('INS type question: What are you importing?', { tag: ['@integration'] }, () => {
  test('starting a new notification from the INS home asks what you are importing, and Back leaves no notification behind', async ({
    pages,
    insPages,
  }) => {
    await insPages.dashboard.open();
    const animalsRequests = requestsTo(pages.page, 'TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
    const plantsRequests = requestsTo(pages.page, 'TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL');

    await insPages.dashboard.btnCreateNew.click();

    await expect(insPages.notificationType.heading).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`${insPages.notificationType.expectedUrl}$`));
    await expect(insPages.notificationType.linkDashboard).toHaveAttribute('aria-current', 'true');

    await insPages.notificationType.linkBack.click();

    await expect(insPages.dashboard.heading).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`${insPages.dashboard.expectedUrl}$`));
    expect(animalsRequests).toEqual([]);
    expect(plantsRequests).toEqual([]);
  });

  test('the INS home offers Create new rather than Start a new notification, before and after a search that matches nothing, and it opens the unselected type question', async ({
    pages,
    insPages,
  }) => {
    await insPages.dashboard.open();
    await expect(insPages.dashboard.btnCreateNew).toBeVisible();
    await expect(pages.page.getByRole('button', { name: 'Start a new notification' })).toHaveCount(0);

    await insPages.dashboard.searchForReference('GBN-AG-26-999999');
    await expect(insPages.dashboard.noSearchResults).toBeVisible();
    await expect(insPages.dashboard.btnCreateNew).toBeVisible();
    await expect(pages.page.getByRole('button', { name: 'Start a new notification' })).toHaveCount(0);

    await insPages.dashboard.btnCreateNew.click();

    const type = insPages.notificationType;
    await expect(type.heading).toBeVisible();
    await expect(type.options.nth(1)).toHaveAccessibleName('Germinal products (semen, ova, embryos)');
    await expect(type.options).toHaveCount(5);
    for (const label of [
      'Live animals',
      'Germinal products (semen, ova, embryos)',
      'Plants for planting',
      'Potatoes (seed and ware)',
      'Wood products',
    ]) {
      await expect(type.option(label)).not.toBeChecked();
    }
  });

  test('the type question offers five unselected options, a single Continue button, the alpha banner and no draft strip', async ({
    pages,
    insPages,
  }) => {
    await insPages.dashboard.open();
    await insPages.dashboard.btnCreateNew.click();
    const type = insPages.notificationType;

    await expect(pages.page).toHaveTitle('What are you importing? - Import notification service - GOV.UK');
    await expect(type.caption).toHaveText('About the consignment');

    await expect(type.options).toHaveCount(5);
    const values = await type.options.evaluateAll((radios) => radios.map((radio) => radio.getAttribute('value')));
    expect(values).toEqual(OPTION_VALUES);
    for (const label of [
      'Live animals',
      'Germinal products (semen, ova, embryos)',
      'Plants for planting',
      'Potatoes (seed and ware)',
      'Wood products',
    ]) {
      await expect(type.option(label)).toBeVisible();
      await expect(type.option(label)).not.toBeChecked();
    }
    await expect(pages.page.locator('.govuk-hint')).toHaveCount(0);

    await expect(type.buttons).toHaveCount(1);
    await expect(type.btnContinue).toBeVisible();
    await expect(pages.page.getByRole('button', { name: 'Save and return to overview' })).toHaveCount(0);
    await expect(pages.page.getByRole('link', { name: 'Cancel' })).toHaveCount(0);

    await expect(type.journeyStrip).toHaveCount(0);
    await expect(pages.page.getByText(GBN_AG)).toHaveCount(0);

    await expect(type.phaseBanner).toContainText('Alpha');
    await expect(type.phaseBanner).toContainText('This is a new service. Help us improve it and give your feedback by email.');
    const feedbackHref = await type.phaseBanner.getByRole('link').getAttribute('href');
    expect(feedbackHref).not.toBe('#');
    expect(feedbackHref).toMatch(/^mailto:/);
  });

  test('continuing with nothing chosen shows the error summary, the inline error and an Error: title', async ({ pages, insPages }) => {
    await insPages.dashboard.open();
    await insPages.dashboard.btnCreateNew.click();
    const type = insPages.notificationType;

    await type.btnContinue.click();

    await expect(type.errorSummary).toContainText('There is a problem');
    await expect(type.errorSummaryLink).toHaveAttribute('href', '#notificationType');
    await expect(type.inlineError).toContainText('Select what you are importing');
    await expect(pages.page).toHaveTitle('Error: What are you importing? - Import notification service - GOV.UK');
  });

  test('choosing Live animals creates a live-animals draft on its Origin of the import page', async ({ pages, insPages, animalsPages }) => {
    await insPages.dashboard.open();
    await insPages.dashboard.btnCreateNew.click();

    await insPages.notificationType.option('Live animals').check();
    await insPages.notificationType.continueToService();

    await expect(animalsPages.originOfImport.heading).toBeVisible();
    const id = animalsPages.originOfImport.journeyIdFromUrl();
    const strip = animalsPages.originOfImport.journeyStrip;
    await expect(strip.locator('.govuk-tag')).toHaveText('Draft');
    await expect(strip).toContainText(GBN_AG);
    await expect(strip).toContainText(id);
    await expect(pages.page.locator('.govuk-phase-banner')).toContainText('Alpha');
  });

  test('choosing Germinal products sends the user to the germinal products start and creates no live-animals notification', async ({
    pages,
    insPages,
  }) => {
    await insPages.dashboard.open();
    await insPages.dashboard.btnCreateNew.click();
    const animalsRequests = requestsTo(pages.page, 'TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');

    await insPages.notificationType.option('Germinal products (semen, ova, embryos)').check();
    await insPages.notificationType.continueToService();

    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    const landed = new URL(pages.page.url());
    expect(landed.origin).toBe(animalsOrigin);
    expect(landed.pathname).toBe(`${SET_BASES.germinalProducts}/start`);
    expect(animalsRequests.filter((url) => url.pathname.startsWith(`${SET_BASES.liveAnimals}/`))).toEqual([]);
  });

  for (const label of ['Plants for planting', 'Potatoes (seed and ware)', 'Wood products']) {
    test(`choosing ${label} creates a plants draft on the plants service's first page`, async ({ pages, insPages, plantsPages }) => {
      await insPages.dashboard.open();
      await insPages.dashboard.btnCreateNew.click();
      const animalsRequests = requestsTo(pages.page, 'TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');

      await insPages.notificationType.option(label).check();
      await insPages.notificationType.continueToService();

      await expect(plantsPages.commodityType.heading).toBeVisible();
      const reference = plantsPages.commodityType.journeyIdFromUrl();
      expect(reference).toMatch(PLANTS_REFERENCE);
      await expect(pages.page).toHaveURL(new RegExp(`${plantsPages.commodityType.expectedUrl(reference)}$`));
      expect(animalsRequests.filter((url) => url.pathname.startsWith(`${SET_BASES.liveAnimals}/`))).toEqual([]);
    });
  }
});

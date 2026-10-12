import { type Page } from '@playwright/test';
import { requireBaseUrl } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';

import { test, expect } from '@fixtures';

const LIVE_ANIMALS = 'Live animals';
const GERMINAL_PRODUCTS = 'Germinal products (semen, ova, embryos)';
const TEMPLATE_ORIGIN = new RegExp(`${SET_BASES.liveAnimals}/templates/[^/]+/origin$`);
const WEEKLY_NAME = 'Weekly Irish cattle';

/** Collects the URLs the page requests from the animals service, so a test can show what was never called. */
function requestsToAnimals(page: Page): URL[] {
  const origin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
  const urls: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin === origin) urls.push(url);
  });
  return urls;
}

test.describe('Create a template', { tag: '@integration' }, () => {
  test.beforeEach(async ({ pages, insPages, animalsPages }) => {
    await animalsPages.manageTemplates.open();
    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    await Promise.all([
      pages.page.waitForURL((url) => url.origin !== animalsOrigin),
      animalsPages.manageTemplates.btnCreateNewTemplate.click(),
    ]);
    await insPages.notificationType.completeSignInIfRequested();
  });

  test('Create new template opens the type question in template mode: two unselected options, Continue, Back to Manage templates and Templates current', async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const type = insPages.notificationType;

    await expect(pages.page).toHaveURL(new RegExp(`${type.templateModeUrl}$`));
    await expect(type.heading).toBeVisible();
    await expect(type.caption).toHaveText('About the consignment');
    await expect(type.options).toHaveCount(2);
    await expect(type.option(LIVE_ANIMALS)).not.toBeChecked();
    await expect(type.option(GERMINAL_PRODUCTS)).not.toBeChecked();
    for (const label of ['Plants for planting', 'Potatoes (seed and ware)', 'Wood products']) {
      await expect(type.option(label)).toHaveCount(0);
    }
    await expect(type.buttons).toHaveCount(1);
    await expect(type.btnContinue).toBeVisible();
    await expect(type.journeyStrip).toHaveCount(0);
    await expect(type.linkTemplates).toHaveAttribute('aria-current', 'true');
    await expect(type.linkBack).toHaveAttribute('href', new RegExp(`${animalsPages.manageTemplates.expectedUrl}$`));
  });

  test('continuing with nothing chosen shows the error linked to the first radio', async ({ pages, insPages }) => {
    const type = insPages.notificationType;

    await type.btnContinue.click();

    await expect(type.errorSummaryLink).toHaveAttribute('href', '#notificationType');
    await expect(pages.page).toHaveTitle('Error: What are you importing? - Import notification service - GOV.UK');

    await type.errorSummaryLink.click();

    await expect(type.options.first()).toBeFocused();
  });

  test('leaving before the name page is posted adds nothing to Manage templates', async ({ insPages, animalsPages }) => {
    // The beforeEach has already left Manage templates, so read its count and the draft list again from a fresh visit first.
    const draftsBefore = await animalsPages.dashboard.draftReferences();
    await animalsPages.manageTemplates.open();
    const before = await animalsPages.manageTemplates.resultsCount.textContent();

    await animalsPages.manageTemplates.btnCreateNewTemplate.click();
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();
    await expect(animalsPages.templateName.heading).toBeVisible();
    await animalsPages.templateName.linkCancel.click();

    await expect(animalsPages.manageTemplates.heading).toBeVisible();
    await expect(animalsPages.manageTemplates.resultsCount).toHaveText(before ?? '');
    expect(await animalsPages.dashboard.draftReferences()).toEqual(draftsBefore);
  });

  test('Live animals goes to the template name page; Back shows Live animals still selected', async ({ pages, insPages, animalsPages }) => {
    const { templateName } = animalsPages;

    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();

    await expect(pages.page).toHaveTitle('Enter template name - Import notification service - GOV.UK');
    await expect(templateName.caption).toBeVisible();
    await expect(templateName.heading).toBeVisible();
    await expect(templateName.inputName).toBeVisible();
    await expect(templateName.hints).toHaveCount(0);
    await expect(templateName.btnSaveAndContinue).toBeVisible();
    await expect(templateName.linkCancel).toHaveAttribute('href', new RegExp(`${animalsPages.manageTemplates.expectedUrl}$`));

    await templateName.linkBack.click();

    await expect(insPages.notificationType.option(LIVE_ANIMALS)).toBeChecked();
  });

  test('Germinal products also goes to the template name page', async ({ pages, insPages, animalsPages }) => {
    await insPages.notificationType.option(GERMINAL_PRODUCTS).check();
    await insPages.notificationType.continueToService();

    await expect(pages.page).toHaveTitle('Enter template name - Import notification service - GOV.UK');
    await expect(animalsPages.templateName.heading).toBeVisible();
  });

  test('Germinal products: Back from the name page shows Germinal products still selected', async ({ insPages, animalsPages }) => {
    await insPages.notificationType.option(GERMINAL_PRODUCTS).check();
    await insPages.notificationType.continueToService();
    await expect(animalsPages.templateName.heading).toBeVisible();

    await animalsPages.templateName.linkBack.click();

    await expect(insPages.notificationType.option(GERMINAL_PRODUCTS)).toBeChecked();
    await expect(insPages.notificationType.option(LIVE_ANIMALS)).not.toBeChecked();
  });

  test('the name page opened with no type chosen sends Back to Manage templates', async ({ animalsPages }) => {
    const { templateName, manageTemplates } = animalsPages;

    await templateName.navigateToFrontend(templateName.newUrl);

    await expect(templateName.heading).toBeVisible();
    await expect(templateName.linkBack).toHaveAttribute('href', new RegExp(`${manageTemplates.expectedUrl}$`));
  });

  test('a trimmed name moves on to Origin of the import in template mode', async ({ pages, insPages, animalsPages }) => {
    const { templateName, originOfImport } = animalsPages;
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();

    await templateName.inputName.fill(`  ${WEEKLY_NAME}  `);
    await templateName.btnSaveAndContinue.click();

    await expect(originOfImport.heading).toBeVisible();
    await expect(pages.page).toHaveURL(TEMPLATE_ORIGIN);
    await expect(originOfImport.statusTag).toHaveText('Template');
    await expect(originOfImport.journeyStrip).toContainText(WEEKLY_NAME);
    await expect(originOfImport.caption).toBeVisible();
    await expect(originOfImport.saveAndContinue).toBeVisible();
    await expect(originOfImport.btnSaveAndReturn).toHaveCount(0);
    await expect(originOfImport.linkCancel).toHaveCount(0);

    await originOfImport.linkBack.click();

    await expect(templateName.heading).toBeVisible();
    await expect(templateName.inputName).toHaveValue(WEEKLY_NAME);

    await animalsPages.manageTemplates.open();
    await animalsPages.manageTemplates.btnCreateNewTemplate.click();
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();

    await expect(templateName.inputName).toHaveValue('');
  });

  test('a blank name is accepted with no error', async ({ pages, insPages, animalsPages }) => {
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();

    await animalsPages.templateName.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(TEMPLATE_ORIGIN);
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(animalsPages.originOfImport.alert).toHaveCount(0);
  });

  test('starting and naming a template creates no notification', async ({ pages, insPages, animalsPages }) => {
    const { templateName, originOfImport, dashboard } = animalsPages;
    const draftsBefore = await dashboard.draftReferences();
    await animalsPages.manageTemplates.open();
    const requests = requestsToAnimals(pages.page);
    await animalsPages.manageTemplates.btnCreateNewTemplate.click();
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();

    await templateName.inputName.fill(WEEKLY_NAME);
    await templateName.btnSaveAndContinue.click();

    await expect(originOfImport.heading).toBeVisible();
    await expect(originOfImport.notificationReference).toHaveCount(0);
    await expect(originOfImport.draftTag).toHaveCount(0);
    expect(await dashboard.draftReferences()).toEqual(draftsBefore);
    const created = requests.filter(
      ({ pathname }) => pathname.startsWith(`${SET_BASES.liveAnimals}/notifications`) || pathname === `${SET_BASES.liveAnimals}/start`,
    );
    expect(created).toEqual([]);
  });

  test('origin in template mode requires the region of origin code when Yes is chosen', async ({ pages, insPages, animalsPages }) => {
    const { templateName, originOfImport } = animalsPages;
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();
    await templateName.btnSaveAndContinue.click();
    await expect(originOfImport.heading).toBeVisible();

    await originOfImport.radioRequiresOriginCode('Yes').check();
    await originOfImport.saveAndContinue.click();

    await expect(originOfImport.errorSummary).toBeVisible();
    await expect(pages.page).toHaveTitle(/^Error: /);
  });

  test('origin in template mode refuses a malformed region code', async ({ pages, insPages, animalsPages }) => {
    const { templateName, originOfImport } = animalsPages;
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();
    await templateName.btnSaveAndContinue.click();
    await expect(originOfImport.heading).toBeVisible();

    await originOfImport.selectCountry('France');
    await originOfImport.radioRequiresOriginCode('Yes').check();
    await originOfImport.removeRegionCodeMaxLength();
    await originOfImport.regionCode.fill('ABCDEFG');
    await originOfImport.saveAndContinue.click();

    await expect(originOfImport.errorSummary).toBeVisible();
    await expect(originOfImport.errorSummaryLinks.filter({ hasText: 'Region of origin code must be 5 characters or less' })).toBeVisible();
    await expect(pages.page).toHaveURL(TEMPLATE_ORIGIN);
  });

  test('a template offers no Upload documents or declaration page', async ({ pages, insPages, animalsPages }) => {
    const { templateName, originOfImport } = animalsPages;
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();
    await templateName.btnSaveAndContinue.click();
    await expect(originOfImport.heading).toBeVisible();
    const templateId = originOfImport.templateIdFromUrl();
    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;

    for (const slug of ['accompanying-documents', 'declaration']) {
      const response = await pages.page.goto(`${animalsOrigin}${SET_BASES.liveAnimals}/templates/${templateId}/${slug}`);
      expect(response?.status(), slug).toBe(404);
    }
  });
});

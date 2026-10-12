import type { Page } from '@playwright/test';

import { requireBaseUrl } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';
import type { AnimalsPages, InsPages } from '@page-objects';

import { test, expect } from '@fixtures';

const LIVE_ANIMALS = 'Live animals';
const INTERNAL_REFERENCE = 'USE-REF-1';
const REFERENCE_FORMAT = /^GBN-AG-\d{2}-[0-9A-HJKMNP-TV-Z]{6}$/;
const NO_SUCH_TEMPLATE = '000000000000000000000000';
const SECTION_CAPTIONS = [
  '1. About the consignment',
  '2. Description of the goods',
  '3. Transport and arrival',
  '4. Documents',
  '5. Consignment parties',
  '6. Contact address',
];
const TOTALS = ['3', '1'];

test.describe('Using a saved template', { tag: '@integration' }, () => {
  /** Presses Create new template on Manage templates and signs in again on the INS type question when asked. */
  const createNewTemplate = async (page: Page, insPages: InsPages, animalsPages: AnimalsPages): Promise<void> => {
    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    await Promise.all([page.waitForURL((url) => url.origin !== animalsOrigin), animalsPages.manageTemplates.btnCreateNewTemplate.click()]);
    await insPages.notificationType.completeSignInIfRequested();
  };

  /** Walks the new template through Origin and the commodity numbers to its review, presses Save template and lands on Manage templates. */
  const saveTemplate = async (insPages: InsPages, animalsPages: AnimalsPages, name: string): Promise<void> => {
    const { templateName, originOfImport, commoditySelection, overview, consignmentDetails, notificationView, manageTemplates } =
      animalsPages;
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();
    await templateName.inputName.fill(name);
    await templateName.btnSaveAndContinue.click();
    await expect(originOfImport.heading).toBeVisible();
    await originOfImport.selectCountry('France');
    await originOfImport.radioRequiresOriginCode('No').check();
    await originOfImport.internalReference.fill(INTERNAL_REFERENCE);
    await originOfImport.saveAndContinue.click();
    await expect(commoditySelection.heading).toBeVisible();
    await commoditySelection.selectSpecies(['Bos taurus']);
    await commoditySelection.saveAndContinue.click();
    await expect(overview.heading).toBeVisible();
    await overview.task('Commodity details').click();
    await expect(consignmentDetails.heading).toBeVisible();
    await consignmentDetails.fillEveryAnimalCount('3');
    await consignmentDetails.numberOfPackages.fill('1');
    await consignmentDetails.saveAndContinue.click();
    await expect(overview.heading).toBeVisible();
    await overview.btnReviewTemplate.click();
    await expect(notificationView.templateHeading).toBeVisible();
    await notificationView.btnSaveTemplate.click();
    await expect(manageTemplates.heading).toBeVisible();
  };

  const usedName = (): string => `Use cattle ${crypto.randomUUID()}`;

  test.beforeEach(async ({ pages, insPages, animalsPages }) => {
    await animalsPages.manageTemplates.open();
    await createNewTemplate(pages.page, insPages, animalsPages);
  });

  test('Use template on a card starts a new live animals draft on its Notification tasklist', async ({ pages, insPages, animalsPages }) => {
    const { manageTemplates, overview, originOfImport } = animalsPages;
    const name = usedName();
    await saveTemplate(insPages, animalsPages, name);

    await manageTemplates.btnUseTemplate(name).click();

    await expect(overview.heading).toBeVisible();
    expect(overview.journeyIdFromUrl()).toMatch(REFERENCE_FORMAT);
    await expect(overview.taskListHeading('Notification tasklist')).toBeVisible();
    await expect(overview.statusTag).toHaveText('Draft');
    await expect(overview.sectionHeadings).toHaveText(SECTION_CAPTIONS);
    await expect(overview.commodityTotalValues).toHaveText(TOTALS);
    await expect(overview.taskStatus('Arrival details')).toHaveText('To do');
    await expect(overview.taskStatus('Upload documents')).toHaveText('To do');
    await expect(overview.taskStatus('Where is this consignment coming from?')).toHaveText('Complete');
    await expect(overview.btnReturnToDashboard).toHaveAttribute('href', new RegExp(`${SET_BASES.liveAnimals}$`));
    await expect(overview.errorSummary).toHaveCount(0);
    await expect(pages.page.getByRole('main')).not.toContainText(name);

    await overview.task('Where is this consignment coming from?').click();

    await expect(originOfImport.heading).toBeVisible();
    await expect(originOfImport.internalReference).toHaveValue(INTERNAL_REFERENCE);
    await expect(originOfImport.radioRequiresOriginCode('No')).toBeChecked();
  });

  test("Use template on the template's page starts another draft, and the first is unchanged", async ({ insPages, animalsPages }) => {
    const { manageTemplates, templatePage, overview, dashboard } = animalsPages;
    const name = usedName();
    await saveTemplate(insPages, animalsPages, name);
    await manageTemplates.btnUseTemplate(name).click();
    await expect(overview.heading).toBeVisible();
    const first = overview.journeyIdFromUrl();

    await manageTemplates.open();
    await manageTemplates.linkViewTemplate(name).click();
    await expect(templatePage.heading(name)).toBeVisible();
    await templatePage.btnUseTemplate.click();

    await expect(overview.heading).toBeVisible();
    const second = overview.journeyIdFromUrl();
    expect(second).toMatch(REFERENCE_FORMAT);
    expect(second).not.toBe(first);

    await dashboard.open();
    await dashboard.searchForReference(first);
    await expect(dashboard.notificationCard(first).locator('.govuk-tag')).toHaveText('Draft');
    await dashboard.searchForReference(second);
    await expect(dashboard.notificationCard(second).locator('.govuk-tag')).toHaveText('Draft');
    await dashboard.searchForReference(first);
    await dashboard.resume(first).click();
    await expect(overview.heading).toBeVisible();
    await expect(overview.commodityTotalValues).toHaveText(TOTALS);
  });

  test('using a template that does not exist opens Manage templates', async ({ pages, insPages, animalsPages }) => {
    const { manageTemplates, templatePage } = animalsPages;
    const name = usedName();
    await saveTemplate(insPages, animalsPages, name);
    await manageTemplates.linkViewTemplate(name).click();
    await expect(templatePage.heading(name)).toBeVisible();
    const crumb = await templatePage.crumb.inputValue();
    const baseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');

    const response = await pages.page.request.post(`${baseUrl}${SET_BASES.liveAnimals}/templates/${NO_SUCH_TEMPLATE}/use`, {
      form: { crumb },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toMatch(new RegExp(`${SET_BASES.liveAnimals}/templates$`));
    await manageTemplates.open();
    await expect(manageTemplates.heading).toBeVisible();
  });
});

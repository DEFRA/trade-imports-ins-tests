import { type Page } from '@playwright/test';
import { requireBaseUrl } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';
import type { AnimalsPages, InsPages } from '@page-objects';

import { test, expect } from '@fixtures';

const LIVE_ANIMALS = 'Live animals';
const TEMPLATE_NAME = 'Weekly Irish cattle';

const SECTION_CAPTIONS = [
  '1. About the consignment',
  '2. Description of the goods',
  '3. Transport and arrival',
  '4. Consignment parties',
  '5. Contact address',
];

const templateUrl = (templateId: string, slug = ''): RegExp =>
  new RegExp(`${SET_BASES.liveAnimals}/templates/${templateId}${slug ? `/${slug}` : ''}$`);

test.describe("A template's task list", { tag: '@integration' }, () => {
  /** Walks Manage templates, the type question, the name page and Origin, ending on 'What are you importing?'. */
  const startAtTemplateCommodities = async (pages: { page: Page }, insPages: InsPages, animalsPages: AnimalsPages): Promise<string> => {
    const { templateName, originOfImport, commoditySelection } = animalsPages;
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();
    await templateName.inputName.fill(TEMPLATE_NAME);
    await templateName.btnSaveAndContinue.click();
    await expect(originOfImport.heading).toBeVisible();
    const templateId = originOfImport.templateIdFromUrl();
    await originOfImport.selectCountry('France');
    await originOfImport.radioRequiresOriginCode('No').check();
    await originOfImport.saveAndContinue.click();
    await expect(commoditySelection.heading).toBeVisible();
    await expect(pages.page).toHaveURL(templateUrl(templateId, 'commodities'));
    return templateId;
  };

  test.beforeEach(async ({ pages, insPages, animalsPages }) => {
    await animalsPages.manageTemplates.open();
    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    await Promise.all([
      pages.page.waitForURL((url) => url.origin !== animalsOrigin),
      animalsPages.manageTemplates.btnCreateNewTemplate.click(),
    ]);
    await insPages.notificationType.completeSignInIfRequested();
  });

  test("'What are you importing?' in template mode shows the Template tag and name, goes Back to Origin and offers all three controls", async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { commoditySelection } = animalsPages;
    const templateId = await startAtTemplateCommodities(pages, insPages, animalsPages);

    await expect(commoditySelection.heading).toBeVisible();
    await expect(commoditySelection.statusTag).toHaveText('Template');
    await expect(commoditySelection.journeyStrip).toContainText(TEMPLATE_NAME);
    await expect(commoditySelection.linkBack).toHaveAttribute('href', templateUrl(templateId, 'origin'));
    await expect(commoditySelection.saveAndContinue).toBeVisible();
    await expect(commoditySelection.btnSaveAndReturn).toBeVisible();
    await expect(commoditySelection.linkCancel).toHaveAttribute('href', templateUrl(templateId));
  });

  test("saving 'What are you importing?' returns to the template's task list headed 'Template tasklist' with zero totals", async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { commoditySelection, overview } = animalsPages;
    const templateId = await startAtTemplateCommodities(pages, insPages, animalsPages);

    await commoditySelection.selectSpecies(['Bos taurus']);
    await commoditySelection.saveAndContinue.click();

    await expect(pages.page).toHaveURL(templateUrl(templateId));
    await expect(overview.heading).toBeVisible();
    await expect(overview.statusTag).toHaveText('Template');
    await expect(overview.journeyStrip).toContainText(TEMPLATE_NAME);
    await expect(overview.journeyStrip).not.toContainText('GBN-AG-');
    await expect(overview.taskListHeading('Template tasklist')).toBeVisible();
    await expect(overview.taskListHeading('Notification tasklist')).toHaveCount(0);
    await expect(overview.taskListHeading('Your commodities')).toBeVisible();
    await expect(overview.commodityTotalValues).toHaveText(['0', '0']);
  });

  test("the template's task list has five sections holding the notification's tasks, none for documents, each opening within the template", async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { commoditySelection, overview } = animalsPages;
    const templateId = await startAtTemplateCommodities(pages, insPages, animalsPages);
    await commoditySelection.selectSpecies(['Bos taurus']);
    await commoditySelection.saveAndContinue.click();
    await expect(overview.heading).toBeVisible();

    await expect(overview.sectionHeadings).toHaveText(SECTION_CAPTIONS);
    await expect(overview.taskLists).toHaveCount(5);
    const tasksBySection = [
      ['Where is this consignment coming from?', 'What are you importing?', 'Main import reason'],
      ['Commodity details', 'Identification details', 'Additional details'],
      ['Arrival details', 'Transport details'],
      ['Roles and addresses'],
      ['Contact address for this consignment'],
    ];
    for (const [index, tasks] of tasksBySection.entries()) {
      for (const task of tasks) await expect(overview.taskLists.nth(index)).toContainText(task);
    }
    await expect(pages.page.getByText('Upload documents')).toHaveCount(0);
    await expect(overview.linksTo('accompanying-documents')).toHaveCount(0);
    await expect(overview.linksTo('declaration')).toHaveCount(0);

    await expect(overview.taskStatus('Where is this consignment coming from?')).toHaveText('Complete');
    await expect(overview.taskStatus('What are you importing?')).toHaveText('Complete');
    await expect(overview.taskStatus('Main import reason')).toHaveText('To do');

    await overview.task('Where is this consignment coming from?').click();

    await expect(pages.page).toHaveURL(templateUrl(templateId, 'origin'));
  });

  test("the template's task list ends with Review template and Return to manage templates, and offers no Save template", async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { commoditySelection, overview, manageTemplates } = animalsPages;
    const templateId = await startAtTemplateCommodities(pages, insPages, animalsPages);
    await commoditySelection.selectSpecies(['Bos taurus']);
    await commoditySelection.saveAndContinue.click();
    await expect(overview.heading).toBeVisible();

    await expect(overview.actionButtons).toHaveText(['Review template', 'Return to manage templates']);
    await expect(overview.btnReviewTemplate).toHaveAttribute('href', templateUrl(templateId, 'notification-view'));
    await expect(overview.btnSaveTemplate).toHaveCount(0);

    await overview.btnReturnToManageTemplates.click();

    await expect(manageTemplates.heading).toBeVisible();
  });

  test("Cancel and return to overview on 'What are you importing?' opens the template's task list", async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { commoditySelection, overview } = animalsPages;
    await startAtTemplateCommodities(pages, insPages, animalsPages);

    await commoditySelection.linkCancel.click();

    await expect(overview.heading).toBeVisible();
    await expect(overview.taskListHeading('Template tasklist')).toBeVisible();
  });
});

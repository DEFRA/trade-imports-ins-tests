import { requireBaseUrl } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';
import type { AnimalsPages, InsPages } from '@page-objects';

import { test, expect } from '@fixtures';

const LIVE_ANIMALS = 'Live animals';

const SECTION_CAPTIONS = [
  '1. About the consignment',
  '2. Description of the goods',
  '3. Transport and arrival',
  '4. Consignment parties',
  '5. Contact address',
];

const NOT_APPLICABLE = 'Not applicable';
const REASON_FOR_IMPORT = 'Reason for import';

const templateUrl = (templateId: string): RegExp => new RegExp(`${SET_BASES.liveAnimals}/templates/${templateId}$`);

test.describe('A template review', { tag: '@integration' }, () => {
  /** Walks Manage templates to a cattle template's task list, then opens its review. Returns the template's id. */
  const openTemplateReview = async (insPages: InsPages, animalsPages: AnimalsPages, name: string): Promise<string> => {
    const { templateName, originOfImport, commoditySelection, overview, notificationView } = animalsPages;
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();
    await templateName.inputName.fill(name);
    await templateName.btnSaveAndContinue.click();
    await expect(originOfImport.heading).toBeVisible();
    const templateId = originOfImport.templateIdFromUrl();
    await originOfImport.selectCountry('France');
    await originOfImport.radioRequiresOriginCode('No').check();
    await originOfImport.saveAndContinue.click();
    await expect(commoditySelection.heading).toBeVisible();
    await commoditySelection.selectSpecies(['Bos taurus']);
    await commoditySelection.saveAndContinue.click();
    await expect(overview.heading).toBeVisible();
    await overview.btnReviewTemplate.click();
    await expect(notificationView.templateHeading).toBeVisible();
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

  test("'Review template' opens 'Review your template' under the Template tag and name, with no error summary and no card errors", async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { notificationView } = animalsPages;
    const name = `Review cattle ${Date.now()}`;

    await openTemplateReview(insPages, animalsPages, name);

    await expect(pages.page).toHaveTitle('Review your template - Import notification service - GOV.UK');
    await expect(notificationView.templateHeading).toBeVisible();
    await expect(notificationView.statusTag).toHaveText('Template');
    await expect(notificationView.journeyStrip).toContainText(name);
    await expect(notificationView.errorSummary).toHaveCount(0);
    await expect(notificationView.cardErrors).toHaveCount(0);
  });

  test("the template review shows the task list's five sections, with no uploaded documents or arrival date and 'Not applicable' for every unanswered row", async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { notificationView } = animalsPages;

    await openTemplateReview(insPages, animalsPages, `Review cattle ${Date.now()}`);

    await expect(notificationView.sectionHeadings).toHaveText(SECTION_CAPTIONS);
    await expect(notificationView.summaryCard('Uploaded documents')).toHaveCount(0);
    await expect(pages.page.getByText('Arrival date at port of entry')).toHaveCount(0);
    await expect(notificationView.missingValues).toHaveCount(0);
    await expect(notificationView.rowValue('Arrival details', 'Port of entry')).toHaveText(NOT_APPLICABLE);
    await expect(notificationView.rowValue(REASON_FOR_IMPORT, REASON_FOR_IMPORT)).toHaveText(NOT_APPLICABLE);
    await expect(notificationView.rowValue('Contact address for this consignment', 'Contact address')).toHaveText(NOT_APPLICABLE);
  });

  test('for cattle the template review shows Certified for, Includes unweaned animals and the CPH number, no identification card, and one Main reason for import row', async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { notificationView } = animalsPages;

    await openTemplateReview(insPages, animalsPages, `Review cattle ${Date.now()}`);

    await expect(notificationView.cardKeys('Additional animal details')).toHaveText(['Certified for', 'Includes unweaned animals']);
    await expect(notificationView.cardKeys('Roles and addresses')).toContainText(['County parish holding (CPH) number']);
    await expect(notificationView.cardTitled('Identification details')).toHaveCount(0);
    await expect(pages.page.getByRole('heading', { name: 'Animal details', exact: true })).toHaveCount(0);
    await expect(notificationView.cardKeys(REASON_FOR_IMPORT)).toHaveText([REASON_FOR_IMPORT]);
  });

  test("the template review's Back link returns to the template's task list", async ({ pages, insPages, animalsPages }) => {
    const { notificationView, overview } = animalsPages;
    const templateId = await openTemplateReview(insPages, animalsPages, `Review cattle ${Date.now()}`);

    await notificationView.linkBack.click();

    await expect(pages.page).toHaveURL(templateUrl(templateId));
    await expect(overview.taskListHeading('Template tasklist')).toBeVisible();
  });

  test('Change on the template review opens Origin and the contact address page for the template, each with its template-creation buttons', async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { notificationView, originOfImport, contactAddress } = animalsPages;
    const templateId = await openTemplateReview(insPages, animalsPages, `Review cattle ${Date.now()}`);

    await notificationView.changeLink('Change import details').click();

    await expect(originOfImport.heading).toBeVisible();
    await expect(originOfImport.statusTag).toHaveText('Template');
    await expect(originOfImport.saveAndContinue).toBeVisible();
    await expect(originOfImport.btnSaveAndReturn).toHaveCount(0);

    await pages.page.goBack();
    await expect(notificationView.templateHeading).toBeVisible();
    await notificationView.changeLink('Change contact address for this consignment').click();

    await expect(contactAddress.heading).toBeVisible();
    await expect(contactAddress.statusTag).toHaveText('Template');
    await expect(contactAddress.saveAndContinue).toBeVisible();
    await expect(contactAddress.btnSaveAndReturn).toBeVisible();
    await expect(contactAddress.linkCancel).toHaveAttribute('href', templateUrl(templateId));
    await expect(contactAddress.btnSaveAndReturnBare).toHaveCount(0);
    await expect(contactAddress.linkCancelBare).toHaveCount(0);
  });

  test('Save template saves the template and opens Manage templates, where it is listed, instead of the declaration', async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { notificationView, manageTemplates } = animalsPages;
    const name = `Review cattle ${Date.now()}`;
    await openTemplateReview(insPages, animalsPages, name);

    await expect(notificationView.btnSaveTemplate).toHaveText('Save template');
    await notificationView.btnSaveTemplate.click();

    await expect(manageTemplates.heading).toBeVisible();
    await expect(pages.page).not.toHaveURL(/declaration/);
    await expect(manageTemplates.templateCards.filter({ hasText: name })).toHaveCount(1);
  });
});

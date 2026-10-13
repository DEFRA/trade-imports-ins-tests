import type { Page } from '@playwright/test';

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

const NO_SUCH_TEMPLATE = '000000000000000000000000';

const templateUrl = (templateId: string): RegExp => new RegExp(`${SET_BASES.liveAnimals}/templates/${templateId}$`);

test.describe('A saved template', () => {
  /** Presses Create new template on Manage templates and signs in again on the INS type question when asked. */
  const createNewTemplate = async (page: Page, insPages: InsPages, animalsPages: AnimalsPages): Promise<void> => {
    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    await Promise.all([page.waitForURL((url) => url.origin !== animalsOrigin), animalsPages.manageTemplates.btnCreateNewTemplate.click()]);
    await insPages.notificationType.completeSignInIfRequested();
  };

  /** Walks the new template through to its review, presses Save template and lands on Manage templates. Returns the template's id. */
  const saveTemplate = async (insPages: InsPages, animalsPages: AnimalsPages, name: string): Promise<string> => {
    const { templateName, originOfImport, commoditySelection, overview, notificationView, manageTemplates } = animalsPages;
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
    await notificationView.btnSaveTemplate.click();
    await expect(manageTemplates.heading).toBeVisible();
    return templateId;
  };

  const viewedName = (): string => `View cattle ${Date.now()}`;

  /** Saves a template under a fresh name and opens its page with View template. */
  const saveAndView = async (insPages: InsPages, animalsPages: AnimalsPages, name: string): Promise<string> => {
    const templateId = await saveTemplate(insPages, animalsPages, name);
    await animalsPages.manageTemplates.linkViewTemplate(name).click();
    await expect(animalsPages.templatePage.heading(name)).toBeVisible();
    return templateId;
  };

  test.beforeEach(async ({ pages, insPages, animalsPages }) => {
    await animalsPages.manageTemplates.open();
    await createNewTemplate(pages.page, insPages, animalsPages);
  });

  test("View template opens the template page: caption 'Templates', the name as its heading and browser title", async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const name = viewedName();

    const templateId = await saveAndView(insPages, animalsPages, name);

    await expect(pages.page).toHaveURL(templateUrl(templateId));
    await expect(pages.page).toHaveTitle(`${name} - Import notification service - GOV.UK`);
    await expect(animalsPages.templatePage.heading(name)).toBeVisible();
    await expect(animalsPages.templatePage.caption).toBeVisible();
  });

  test("the template page shows 'Date created:' with the day it was saved", async ({ insPages, animalsPages }) => {
    const today = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' }).format(
      new Date(),
    );

    await saveAndView(insPages, animalsPages, viewedName());

    await expect(animalsPages.templatePage.dateCreated).toHaveText(`Date created: ${today}`);
  });

  test('the template page offers a primary Use template button in a POST form and a red Delete button, and no Edit', async ({
    insPages,
    animalsPages,
  }) => {
    const { templatePage } = animalsPages;

    const templateId = await saveAndView(insPages, animalsPages, viewedName());

    await expect(templatePage.btnUseTemplate).not.toHaveClass(/govuk-button--secondary/);
    await expect(templatePage.useTemplateForm).toHaveAttribute('method', 'post');
    await expect(templatePage.useTemplateForm).toHaveAttribute('action', new RegExp(`/templates/${templateId}/use$`));
    await expect(templatePage.btnDelete).toHaveClass(/govuk-button--warning/);
    await expect(templatePage.btnDelete).toHaveAttribute('href', new RegExp(`/templates/${templateId}/delete$`));
    await expect(templatePage.linksEdit).toHaveCount(0);
    await expect(templatePage.buttonsEdit).toHaveCount(0);
  });

  test('Back on the template page goes to Manage templates', async ({ pages, insPages, animalsPages }) => {
    await saveAndView(insPages, animalsPages, viewedName());

    await pages.page.getByRole('link', { name: 'Back', exact: true }).click();

    await expect(animalsPages.manageTemplates.heading).toBeVisible();
  });

  test("the template page lists the answers in five numbered sections, and each card's Change link opens a page of the template", async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { templatePage } = animalsPages;

    const templateId = await saveAndView(insPages, animalsPages, viewedName());

    await expect(templatePage.sectionHeadings).toHaveText(SECTION_CAPTIONS);
    await expect(templatePage.rowValue('Origin of import', 'Country of origin')).toContainText('France');
    await expect(templatePage.changeLink('origin of import')).toHaveAttribute(
      'href',
      new RegExp(`/templates/${templateId}/origin\\?change=1$`),
    );
    await expect(templatePage.changeLink('Cow (0102)')).toHaveAttribute(
      'href',
      new RegExp(`/templates/${templateId}/consignment-details\\?change=1$`),
    );
    await expect(templatePage.changeLink('addresses')).toHaveAttribute(
      'href',
      new RegExp(`/templates/${templateId}/addresses\\?change=1$`),
    );
    await expect(templatePage.changeLink('contact address')).toHaveAttribute(
      'href',
      new RegExp(`/templates/${templateId}/consignment/contact/select\\?change=1$`),
    );

    await templatePage.changeLink('origin of import').click();
    await expect(pages.page).toHaveURL(new RegExp(`/templates/${templateId}/origin\\?change=1$`));
  });

  test('a template that does not exist goes to Manage templates', async ({ pages, animalsPages }) => {
    await animalsPages.manageTemplates.navigateToFrontend(`${SET_BASES.liveAnimals}/templates/${NO_SUCH_TEMPLATE}`);

    await expect(animalsPages.manageTemplates.heading).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/templates$`));
  });
});

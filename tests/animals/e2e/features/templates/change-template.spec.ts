import type { Page } from '@playwright/test';

import { requireBaseUrl } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';
import type { AnimalsPages, InsPages } from '@page-objects';

import { test, expect } from '@fixtures';

const LIVE_ANIMALS = 'Live animals';
const SAVED_REFERENCE = 'REF-SAVED-1';
const CHANGED_REFERENCE = 'REF-CHANGED-2';
const UNSAVED_REFERENCE = 'REF-NEVER-SAVED-3';
const NO_SUCH_TEMPLATE = '000000000000000000000000';

const templateUrl = (templateId: string): RegExp => new RegExp(`${SET_BASES.liveAnimals}/templates/${templateId}$`);

test.describe('Changing one section of a saved template', () => {
  /** Presses Create new template on Manage templates and signs in again on the INS type question when asked. */
  const createNewTemplate = async (page: Page, insPages: InsPages, animalsPages: AnimalsPages): Promise<void> => {
    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    await Promise.all([page.waitForURL((url) => url.origin !== animalsOrigin), animalsPages.manageTemplates.btnCreateNewTemplate.click()]);
    await insPages.notificationType.completeSignInIfRequested();
  };

  /** Walks the new template through to its review, with an internal reference on Origin, presses Save template and lands on Manage templates. Returns the template's id. */
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
    await originOfImport.internalReference.fill(SAVED_REFERENCE);
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

  const changedName = (): string => `Change cattle ${crypto.randomUUID()}`;

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

  test('Change on a saved template opens Origin with only Save and return and Cancel, and Back returns to the template page', async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { templatePage, originOfImport } = animalsPages;
    const name = changedName();
    const templateId = await saveAndView(insPages, animalsPages, name);

    await templatePage.changeLink('import details').click();

    await expect(originOfImport.heading).toBeVisible();
    await expect(originOfImport.internalReference).toHaveValue(SAVED_REFERENCE);
    await expect(originOfImport.submitButtons).toHaveText(['Save and return']);
    await expect(originOfImport.linkCancelToTemplate).toHaveAttribute('href', templateUrl(templateId));

    await originOfImport.linkBack.click();

    await expect(pages.page).toHaveURL(templateUrl(templateId));
    await expect(templatePage.heading(name)).toBeVisible();
  });

  test('Save and return updates the template, shows the Success banner once, shows Date created as today and leaves the draft notifications unchanged', async ({
    pages,
    insPages,
    animalsPages,
  }) => {
    const { templatePage, originOfImport, dashboard } = animalsPages;
    const name = changedName();
    const today = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' }).format(
      new Date(),
    );
    const templateId = await saveAndView(insPages, animalsPages, name);
    const draftsBefore = await dashboard.draftReferences();
    await animalsPages.manageTemplates.open();
    await animalsPages.manageTemplates.linkViewTemplate(name).click();

    await templatePage.changeLink('import details').click();
    await originOfImport.internalReference.fill(CHANGED_REFERENCE);
    await originOfImport.btnSaveAndReturnToTemplate.click();

    await expect(pages.page).toHaveURL(templateUrl(templateId));
    await expect(templatePage.rowValue('Import details', 'Internal reference number')).toContainText(CHANGED_REFERENCE);
    await expect(templatePage.successBannerTitle).toBeVisible();
    await expect(templatePage.successBannerHeading(`${name} has been updated`)).toBeVisible();
    await expect(templatePage.dateCreated).toHaveText(`Date created: ${today}`);

    await pages.page.reload();

    await expect(templatePage.successBanner).toHaveCount(0);
    expect(await dashboard.draftReferences()).toEqual(draftsBefore);
  });

  test('leaving a change with Cancel keeps the saved answer', async ({ pages, insPages, animalsPages }) => {
    const { templatePage, originOfImport } = animalsPages;
    const templateId = await saveAndView(insPages, animalsPages, changedName());

    await templatePage.changeLink('import details').click();
    await originOfImport.internalReference.fill(UNSAVED_REFERENCE);
    await originOfImport.linkCancelToTemplate.click();

    await expect(pages.page).toHaveURL(templateUrl(templateId));
    await expect(templatePage.rowValue('Import details', 'Internal reference number')).toContainText(SAVED_REFERENCE);
    await expect(templatePage.successBanner).toHaveCount(0);
  });

  test('changing a template that does not exist goes to Manage templates', async ({ pages, animalsPages }) => {
    await animalsPages.manageTemplates.navigateToFrontend(`${SET_BASES.liveAnimals}/templates/${NO_SUCH_TEMPLATE}/origin?change=1`);

    await expect(animalsPages.manageTemplates.heading).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/templates$`));
  });
});

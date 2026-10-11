import type { Page } from '@playwright/test';

import { requireBaseUrl } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';
import { createAnimalsPages, createInsPages, createSharedPages } from '@page-objects';
import type { AnimalsPages, InsPages } from '@page-objects';
import { users } from '@config/users';

import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';

const LIVE_ANIMALS = 'Live animals';
const UNTITLED = 'Untitled template';

type SignInOptions = { userId?: string; organisationSbi?: string };

test.describe('Saving a template', { tag: '@integration' }, () => {
  /** Presses Create new template on Manage templates and signs in again on the INS type question when asked. */
  const createNewTemplate = async (page: Page, insPages: InsPages, animalsPages: AnimalsPages, options?: SignInOptions): Promise<void> => {
    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    await Promise.all([page.waitForURL((url) => url.origin !== animalsOrigin), animalsPages.manageTemplates.btnCreateNewTemplate.click()]);
    await insPages.notificationType.completeSignInIfRequested(options);
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

  const savedName = (): string => `Saved cattle ${Date.now()}`;

  test.describe('from a signed-in session', () => {
    let before: number;

    test.beforeEach(async ({ pages, insPages, animalsPages }) => {
      await animalsPages.manageTemplates.open();
      before = await animalsPages.manageTemplates.totalResults();
      await createNewTemplate(pages.page, insPages, animalsPages);
    });

    test('Save template saves a part-answered template and lists it first on Manage templates, one more than before', async ({
      insPages,
      animalsPages,
    }) => {
      const { manageTemplates } = animalsPages;
      const name = savedName();

      const templateId = await saveTemplate(insPages, animalsPages, name);

      await expect(manageTemplates.firstCardViewLink).toHaveAttribute('href', new RegExp(`/templates/${templateId}$`));
      expect(await manageTemplates.totalResults()).toBeGreaterThanOrEqual(before + 1);
      await expect(manageTemplates.templateCard(name)).toBeVisible();
    });

    test("after saving, Manage templates shows a Success banner headed '<name> saved to templates', once", async ({
      pages,
      insPages,
      animalsPages,
    }) => {
      const { manageTemplates } = animalsPages;
      const name = savedName();

      await saveTemplate(insPages, animalsPages, name);

      await expect(manageTemplates.successBanner).toHaveAttribute('role', 'alert');
      await expect(manageTemplates.successBannerTitle).toHaveText('Success');
      await expect(manageTemplates.successBannerHeading).toHaveText(`${name} saved to templates`);

      await pages.page.reload();

      await expect(manageTemplates.heading).toBeVisible();
      await expect(manageTemplates.successBanner).toHaveCount(0);
    });

    test("a template saved with no name is listed first as 'Untitled template' with the banner 'Untitled template saved to templates'", async ({
      insPages,
      animalsPages,
    }) => {
      const { manageTemplates } = animalsPages;

      const templateId = await saveTemplate(insPages, animalsPages, '');

      await expect(manageTemplates.successBannerHeading).toHaveText(`${UNTITLED} saved to templates`);
      await expect(manageTemplates.firstCardViewLink).toHaveAttribute('href', new RegExp(`/templates/${templateId}$`));
      await expect(manageTemplates.templateTitles.first()).toHaveText(UNTITLED);
    });

    test("each template card is labelled 'Template <title>' with its category, an H3 title, View template and a Use template button in a form", async ({
      insPages,
      animalsPages,
    }) => {
      const { manageTemplates } = animalsPages;
      const name = savedName();

      const templateId = await saveTemplate(insPages, animalsPages, name);

      await expect(manageTemplates.templateCard(name)).toBeVisible();
      await expect(manageTemplates.cardCategory(name)).toHaveText(LIVE_ANIMALS);
      await expect(manageTemplates.templateCard(name).getByRole('heading', { level: 3 })).toHaveText(name);
      await expect(manageTemplates.linkViewTemplate(name)).toHaveAttribute('href', new RegExp(`/templates/${templateId}$`));
      await expect(manageTemplates.btnUseTemplate(name)).toHaveClass(/govuk-button--secondary/);
      await expect(manageTemplates.useTemplateForm(name)).toHaveAttribute('method', 'post');
      await expect(manageTemplates.useTemplateForm(name)).toHaveAttribute('action', new RegExp(`/templates/${templateId}/use$`));
    });

    test('of two templates saved one after the other, the later is listed first', async ({ pages, insPages, animalsPages }) => {
      const { manageTemplates } = animalsPages;
      const first = `Saved first ${Date.now()}`;
      const second = `Saved second ${Date.now()}`;

      await saveTemplate(insPages, animalsPages, first);
      await createNewTemplate(pages.page, insPages, animalsPages);
      await saveTemplate(insPages, animalsPages, second);

      const titles = await manageTemplates.templateTitles.allTextContents();
      expect(titles.indexOf(second)).toBeGreaterThanOrEqual(0);
      expect(titles.indexOf(first)).toBeGreaterThanOrEqual(0);
      expect(titles.indexOf(second)).toBeLessThan(titles.indexOf(first));
    });

    test("a saved template never appears among the user's notifications on the dashboard", async ({ pages, insPages, animalsPages }) => {
      const name = savedName();
      await saveTemplate(insPages, animalsPages, name);

      await animalsPages.dashboard.open();

      await expect(pages.page.getByRole('main').getByText(name)).toHaveCount(0);
    });
  });

  test.describe('across sessions and users', () => {
    test('a saved template is still listed after signing out and back in', async ({ browser }) => {
      // The sign-out happens only in this cold context, so the suite's shared signed-in session is untouched.
      const context = await browser.newContext({ storageState: COLD_START });
      try {
        const page = await context.newPage();
        const animalsPages = createAnimalsPages(page);
        const insPages = createInsPages(page);
        const sharedPages = createSharedPages(page);
        const { manageTemplates } = animalsPages;
        const andrew = { userId: users.andrew.crn };
        const name = savedName();

        await manageTemplates.open(true, andrew);
        await createNewTemplate(page, insPages, animalsPages, andrew);
        await saveTemplate(insPages, animalsPages, name);

        await manageTemplates.linkSignOut.click();
        await expect(sharedPages.signOut.heading).toBeVisible();

        await manageTemplates.open(true, andrew);

        await expect(manageTemplates.templateCard(name)).toBeVisible();
      } finally {
        await context.close();
      }
    });

    test("another user does not see a user's saved template, and opening its address shows their own Manage templates", async ({
      browser,
      pages,
      insPages,
      animalsPages,
    }) => {
      const name = savedName();
      await animalsPages.manageTemplates.open();
      await createNewTemplate(pages.page, insPages, animalsPages);
      await saveTemplate(insPages, animalsPages, name);
      const templateAddress = await animalsPages.manageTemplates.linkViewTemplate(name).evaluate((link: HTMLAnchorElement) => link.href);

      // browser.newContext() inherits the test's storageState; Sarah must start cold.
      const context = await browser.newContext({ storageState: COLD_START });
      try {
        const sarahPage = await context.newPage();
        const sarahPages = createAnimalsPages(sarahPage);

        await sarahPages.manageTemplates.open(true, {
          userId: users.sarah.crn,
          organisationSbi: users.sarah.organisations.gatwickAirport,
        });
        await expect(sarahPages.manageTemplates.templateCard(name)).toHaveCount(0);

        await sarahPage.goto(templateAddress);

        await expect(sarahPages.manageTemplates.heading).toBeVisible();
        await expect(sarahPage).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/templates$`));
        await expect(sarahPage.getByText(name)).toHaveCount(0);
        await expect(sarahPage.getByRole('heading', { name: 'Template tasklist' })).toHaveCount(0);
      } finally {
        await context.close();
      }
    });
  });
});

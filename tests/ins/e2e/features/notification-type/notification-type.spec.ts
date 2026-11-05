import { WHOLE_REFERENCE_NUMBER_PATTERN as ANIMALS_REFERENCE } from '@domain/animals/constants/reference-number-patterns';
import { WHOLE_REFERENCE_NUMBER_PATTERN as PLANTS_REFERENCE } from '@domain/plants/constants/reference-number-patterns';
import type { InsNotificationTypePage } from '@page-objects/ins/notification-type-page';
import { requireBaseUrl } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';
import { recordMainFrameNavigationPaths } from '@utils/playwright/main-frame-navigations';

import type { Page } from '@playwright/test';

import { test, expect } from '@fixtures';

const QUESTION_TITLE = 'What are you importing? - Import notification service - GOV.UK';
const OPTIONS = [
  { value: 'live-animals', label: 'Live animals', service: 'animals' },
  { value: 'germinal-products', label: 'Germinal products (semen, ova, embryos)', service: 'animals' },
  { value: 'plants-for-planting', label: 'Plants for planting', service: 'plants' },
  { value: 'potatoes', label: 'Potatoes (seed and ware)', service: 'plants' },
  { value: 'wood-products', label: 'Wood products', service: 'plants' },
] as const;
const [LIVE_ANIMALS, GERMINAL_PRODUCTS] = OPTIONS;
const PLANTS_OPTIONS = OPTIONS.filter((option) => option.service === 'plants');

const SIGN_IN_PATH = '/auth/sign-in';
const SIGN_IN_CALLBACK_PATH = '/auth/sign-in-oidc';

const originOf = (envVar: Parameters<typeof requireBaseUrl>[0]): string => new URL(requireBaseUrl(envVar)).origin;

const expectOptionsListedInOrderAndUnselected = async (notificationTypePage: InsNotificationTypePage) => {
  await expect(notificationTypePage.options).toHaveCount(OPTIONS.length);
  expect(await notificationTypePage.options.evaluateAll((radios) => radios.map((radio) => radio.getAttribute('value')))).toEqual(
    OPTIONS.map(({ value }) => value),
  );
  for (const { label } of OPTIONS) {
    await expect(notificationTypePage.option(label)).not.toBeChecked();
  }
};

const recordHandOverNavigations = (page: Page) => {
  const animalsOrigin = originOf('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
  return {
    animalsOrigin,
    animalsNavigations: recordMainFrameNavigationPaths(page, animalsOrigin),
    plantsNavigations: recordMainFrameNavigationPaths(page, originOf('TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL')),
  };
};

test.describe('INS notification type question', { tag: ['@animals-frontend', '@plants-frontend'] }, () => {
  test('Back from the question returns to the INS home and neither journey frontend is visited', async ({ pages, insPages }) => {
    const { animalsNavigations, plantsNavigations } = recordHandOverNavigations(pages.page);

    const notificationTypePage = insPages.notificationType;

    await notificationTypePage.open();
    await expect(notificationTypePage.linkDashboard).toHaveAttribute('aria-current', 'true');
    await notificationTypePage.linkBack.click();

    await expect(insPages.dashboard.heading).toBeVisible();
    await expect(pages.page).toHaveURL((url) => url.pathname === insPages.dashboard.expectedUrl);
    expect(animalsNavigations).toEqual([]);
    expect(plantsNavigations).toEqual([]);
  });

  test('the question offers five unselected options under the caption, one Continue button and the alpha banner', async ({
    pages,
    insPages,
  }) => {
    const notificationTypePage = insPages.notificationType;

    await notificationTypePage.open();

    await expect(pages.page).toHaveTitle(QUESTION_TITLE);
    await expect(notificationTypePage.caption).toHaveText('About the consignment');
    await expectOptionsListedInOrderAndUnselected(notificationTypePage);
    await expect(notificationTypePage.hints).toHaveCount(0);
    await expect(notificationTypePage.buttons).toHaveCount(1);
    await expect(pages.page.locator('main').getByRole('link')).toHaveCount(0);
    await expect(notificationTypePage.btnContinue).toBeVisible();
    await expect(notificationTypePage.journeyStrip).toHaveCount(0);
    await expect(notificationTypePage.phaseBanner).toContainText(
      'This is a new service. Help us improve it and give your feedback by email.',
    );
    await expect(notificationTypePage.phaseBanner.getByRole('link')).toHaveAttribute('href', /^mailto:/);
  });

  test('continuing with nothing chosen shows the error summary, the inline error and an Error: title', async ({ pages, insPages }) => {
    const notificationTypePage = insPages.notificationType;
    await notificationTypePage.open();

    await notificationTypePage.btnContinue.click();

    await expect(notificationTypePage.errorSummary).toContainText('There is a problem');
    await expect(notificationTypePage.errorSummaryLink).toHaveAttribute('href', '#notificationType');
    await expect(notificationTypePage.inlineError).toContainText('Select what you are importing');
    await expect(pages.page).toHaveTitle(`Error: ${QUESTION_TITLE}`);
  });

  test('choosing Live animals signs the user in to the animals service and opens a new draft at Origin of the import', async ({
    insPages,
    animalsPages,
    pages,
  }) => {
    test.slow();
    const { animalsNavigations, plantsNavigations } = recordHandOverNavigations(pages.page);
    const notificationTypePage = insPages.notificationType;
    await notificationTypePage.open();

    await notificationTypePage.option(LIVE_ANIMALS.label).check();
    await notificationTypePage.continueToService();

    await expect(animalsPages.originOfImport.heading).toBeVisible();
    const reference = animalsPages.originOfImport.referenceNumberFromUrl();
    expect(reference).toMatch(ANIMALS_REFERENCE);
    await expect(animalsPages.originOfImport.statusTag).toHaveText('Draft');
    await expect(animalsPages.originOfImport.notificationReference).toContainText(reference);
    expect(animalsNavigations).toEqual([
      `${SET_BASES.liveAnimals}/start`,
      SIGN_IN_PATH,
      SIGN_IN_CALLBACK_PATH,
      `${SET_BASES.liveAnimals}/start`,
      `${SET_BASES.liveAnimals}/notifications/${reference}/origin`,
    ]);
    expect(plantsNavigations).toEqual([]);
  });

  test('choosing Germinal products goes to the germinal products start in the animals service and reaches no live animals path', async ({
    insPages,
    pages,
  }) => {
    const { animalsOrigin, animalsNavigations, plantsNavigations } = recordHandOverNavigations(pages.page);
    const notificationTypePage = insPages.notificationType;
    await notificationTypePage.open();

    await notificationTypePage.option(GERMINAL_PRODUCTS.label).check();
    await notificationTypePage.continueToService();

    await expect(pages.page).toHaveURL(`${animalsOrigin}${SET_BASES.germinalProducts}/start`);
    expect(animalsNavigations).toEqual([`${SET_BASES.germinalProducts}/start`]);
    expect(plantsNavigations).toEqual([]);
  });

  for (const { label } of PLANTS_OPTIONS) {
    test(`choosing ${label} signs the user in to the plants service and opens a new plants draft at its first page`, async ({
      insPages,
      plantsPages,
      pages,
    }) => {
      test.slow();
      const { animalsNavigations, plantsNavigations } = recordHandOverNavigations(pages.page);
      const notificationTypePage = insPages.notificationType;
      await notificationTypePage.open();

      await notificationTypePage.option(label).check();
      await notificationTypePage.continueToService();

      await expect(plantsPages.commodityType.heading).toBeVisible();
      const reference = plantsPages.commodityType.referenceNumberFromUrl();
      expect(reference).toMatch(PLANTS_REFERENCE);
      expect(plantsNavigations).toEqual([
        `${SET_BASES.highRiskPlants}/start`,
        SIGN_IN_PATH,
        SIGN_IN_CALLBACK_PATH,
        `${SET_BASES.highRiskPlants}/start`,
        `${SET_BASES.highRiskPlants}/notifications/${reference}/commodity-type`,
      ]);
      expect(animalsNavigations).toEqual([]);
    });
  }
});

test.describe('INS home Create new', () => {
  test('Create new on the INS home links to the question on the INS origin and shows every option unselected', async ({
    pages,
    insPages,
  }) => {
    const notificationTypePage = insPages.notificationType;
    await insPages.dashboard.open();

    await expect(insPages.dashboard.btnCreateNew).toHaveAttribute('href', notificationTypePage.expectedUrl);
    await insPages.dashboard.btnCreateNew.click();

    await expect(pages.page).toHaveURL(`${originOf('TRADE_IMPORTS_INS_FRONTEND_BASE_URL')}${notificationTypePage.expectedUrl}`);
    await expect(notificationTypePage.heading).toBeVisible();
    await expectOptionsListedInOrderAndUnselected(notificationTypePage);
  });
});

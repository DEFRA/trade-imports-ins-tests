import { MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { WHOLE_REFERENCE_NUMBER_PATTERN as ANIMALS_REFERENCE } from '@domain/animals/constants/reference-number-patterns';
import { WHOLE_REFERENCE_NUMBER_PATTERN as PLANTS_REFERENCE } from '@domain/plants/constants/reference-number-patterns';
import type { InsNotificationTypePage } from '@page-objects/ins/notification-type-page';
import { originOf, requireBaseUrl } from '@page-objects/shared/base-page';
import {
  GERMINAL_PRODUCTS,
  LIVE_ANIMALS,
  NOTIFICATION_TYPE_OPTIONS,
  PLANTS_OPTIONS,
  type NotificationTypeOption,
} from '@domain/ins/constants/notification-types';
import { SET_BASES } from '@page-objects/shared/sets';
import { recordMainFrameNavigationPaths } from '@utils/playwright/main-frame-navigations';

import type { Page } from '@playwright/test';

import { test, expect } from '@fixtures';
import { authCookieNameFor } from '@fixtures/auth-state';
import type { PageFixtures } from '@fixtures/ui';

const QUESTION_TITLE = 'What are you importing? - Import notification service - GOV.UK';

const SIGN_IN_PATH = '/auth/sign-in';
const SIGN_IN_CALLBACK_PATH = '/auth/sign-in-oidc';

const expectOptionsListedInOrderAndUnselected = async (notificationTypePage: InsNotificationTypePage) => {
  await expect(notificationTypePage.options).toHaveCount(NOTIFICATION_TYPE_OPTIONS.length);
  expect(await notificationTypePage.options.evaluateAll((radios) => radios.map((radio) => radio.getAttribute('value')))).toEqual(
    NOTIFICATION_TYPE_OPTIONS.map(({ value }) => value),
  );
  for (const { label } of NOTIFICATION_TYPE_OPTIONS) {
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
    await expect(notificationTypePage.optionsError).toContainText('Select what you are importing');
    await expect(pages.page).toHaveTitle(`Error: ${QUESTION_TITLE}`);
  });

  test('choosing Live animals signs the user in to the animals service and opens a new draft at Origin of the import', async ({
    insPages,
    animalsPages,
    animalsJourney,
    pages,
  }) => {
    test.slow();
    const { animalsNavigations, plantsNavigations } = recordHandOverNavigations(pages.page);

    const reference = await animalsJourney.startNotificationFromInsTypeQuestion(insPages.notificationType, LIVE_ANIMALS);

    await expect(animalsPages.originOfImport.heading).toBeVisible();
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

    await notificationTypePage.chooseNotificationType(GERMINAL_PRODUCTS);

    await expect(pages.page).toHaveURL(`${animalsOrigin}${SET_BASES.germinalProducts}/start`);
    expect(animalsNavigations).toEqual([`${SET_BASES.germinalProducts}/start`]);
    expect(plantsNavigations).toEqual([]);
  });

  for (const plantsOption of PLANTS_OPTIONS) {
    test(`choosing ${plantsOption.label} signs the user in to the plants service and opens a new plants draft at its first page`, async ({
      insPages,
      plantsPages,
      pages,
    }) => {
      test.slow();
      const { animalsNavigations, plantsNavigations } = recordHandOverNavigations(pages.page);
      const notificationTypePage = insPages.notificationType;
      await notificationTypePage.open();

      await notificationTypePage.chooseNotificationType(plantsOption);

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

test.describe('Live animals notification started from the INS question', { tag: '@animals-frontend' }, () => {
  const ORIGIN_TASK = 'Where is this consignment coming from?';
  const COMMODITY_TASK = 'What are you importing?';
  const SELECTED_SPECIES = MANDATORY_ANSWERS.commodityLines.map((line) => line.species);

  test('Back from origin opens the INS question with Live animals chosen alone', async ({
    insPages,
    animalsPages,
    animalsJourney,
    pages,
  }) => {
    test.slow();
    await animalsJourney.startNotificationFromInsTypeQuestion(insPages.notificationType, LIVE_ANIMALS);

    await animalsPages.originOfImport.followBackToInsTypeQuestion();

    await expect(pages.page).toHaveURL(
      (url) => url.origin === originOf('TRADE_IMPORTS_INS_FRONTEND_BASE_URL') && url.pathname === insPages.notificationType.expectedUrl,
    );
    await expect(insPages.notificationType.heading).toBeVisible();
    await expect(insPages.notificationType.checkedOptions).toHaveCount(1);
    await expect(insPages.notificationType.option(LIVE_ANIMALS.label)).toBeChecked();
  });

  test('keeping Live animals returns to the same notification and adds no second draft', async ({
    insPages,
    animalsPages,
    animalsJourney,
    pages,
  }) => {
    test.slow();
    const reference = await animalsJourney.startNotificationFromInsTypeQuestion(insPages.notificationType, LIVE_ANIMALS);
    await animalsPages.originOfImport.followBackToInsTypeQuestion();
    const animalsNavigations = recordMainFrameNavigationPaths(pages.page, originOf('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL'));

    await insPages.notificationType.continueToService();

    await expect(pages.page).toHaveURL(
      (url) =>
        url.origin === originOf('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL') &&
        url.pathname === animalsPages.originOfImport.expectedUrl(reference),
    );
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(animalsPages.originOfImport.statusTag).toHaveText('Draft');
    await expect(animalsPages.originOfImport.notificationReference).toContainText(reference);
    expect(animalsNavigations).toEqual([animalsPages.originOfImport.expectedUrl(reference)]);
  });

  const landingCases: {
    type: NotificationTypeOption;
    expectLanding: (landing: Pick<PageFixtures, 'pages' | 'plantsPages'>) => Promise<void>;
  }[] = [
    {
      type: PLANTS_OPTIONS[0],
      expectLanding: async ({ plantsPages }) => {
        await expect(plantsPages.commodityType.heading).toBeVisible();
      },
    },
    {
      type: GERMINAL_PRODUCTS,
      expectLanding: async ({ pages }) => {
        await expect(pages.page).toHaveURL(`${originOf('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')}${SET_BASES.germinalProducts}/start`);
      },
    },
  ];

  for (const { type, expectLanding } of landingCases) {
    test(`choosing ${type.label} instead leaves the live animals notification with its reference, Draft status and answers`, async ({
      insPages,
      animalsPages,
      plantsPages,
      animalsJourney,
      pages,
    }) => {
      test.slow();
      const reference = await animalsJourney.startNotificationFromInsTypeQuestion(insPages.notificationType, LIVE_ANIMALS);
      await animalsJourney.answerOriginAndSelectSpecies(SELECTED_SPECIES);
      await animalsPages.originOfImport.open(reference);
      await animalsJourney.backToInsTypeQuestionAndChoose(insPages.notificationType, type);

      await expectLanding({ pages, plantsPages });
      await animalsPages.dashboard.open();
      await animalsPages.dashboard.searchForReference(reference);
      await expect(animalsPages.dashboard.notificationCard(reference)).toBeVisible();
      await expect(animalsPages.dashboard.cardStatusTag(reference)).toHaveText('Draft');
      await animalsPages.overview.open(reference);
      await expect(animalsPages.overview.taskStatus(ORIGIN_TASK)).toHaveText('Complete');
      await expect(animalsPages.overview.taskStatus(COMMODITY_TASK)).toHaveText('Complete');
      await animalsPages.originOfImport.open(reference);
      await expect(animalsPages.originOfImport.country.field).toHaveValue(MANDATORY_ANSWERS.countryCode.display);
      await animalsPages.commoditySelection.open(reference);
      for (const species of SELECTED_SPECIES) {
        await expect(animalsPages.commoditySelection.selectedSummary).toContainText(species.latinName);
      }
    });
  }

  test('Create new on the INS home after the round trip shows every option unselected', async ({
    insPages,
    animalsPages,
    animalsJourney,
  }) => {
    test.slow();
    await animalsJourney.startNotificationFromInsTypeQuestion(insPages.notificationType, LIVE_ANIMALS);
    await animalsPages.originOfImport.followBackToInsTypeQuestion();

    await insPages.dashboard.open();
    await insPages.dashboard.btnCreateNew.click();

    await expect(insPages.notificationType.heading).toBeVisible();
    await expectOptionsListedInOrderAndUnselected(insPages.notificationType);
  });

  test('signing in to the INS again on the way back still lands on the question with Live animals chosen', async ({
    insPages,
    animalsPages,
    animalsJourney,
    pages,
  }) => {
    test.slow();
    const insBaseUrl = requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL');
    await animalsJourney.startNotificationFromInsTypeQuestion(insPages.notificationType, LIVE_ANIMALS);
    const insNavigations = recordMainFrameNavigationPaths(pages.page, originOf('TRADE_IMPORTS_INS_FRONTEND_BASE_URL'));
    await pages.page.context().clearCookies({ name: authCookieNameFor('ins', insBaseUrl) });

    await animalsPages.originOfImport.followBackToInsTypeQuestion();

    await expect(insPages.notificationType.heading).toBeVisible();
    await expect(insPages.notificationType.option(LIVE_ANIMALS.label)).toBeChecked();
    expect(insNavigations).toEqual([
      insPages.notificationType.expectedUrl,
      SIGN_IN_PATH,
      SIGN_IN_CALLBACK_PATH,
      insPages.notificationType.expectedUrl,
    ]);
  });

  test('signing in to the animals service again on the way back still lands on the same notification origin page', async ({
    insPages,
    animalsPages,
    animalsJourney,
    pages,
  }) => {
    test.slow();
    const animalsBaseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
    const reference = await animalsJourney.startNotificationFromInsTypeQuestion(insPages.notificationType, LIVE_ANIMALS);
    await animalsPages.originOfImport.followBackToInsTypeQuestion();
    const animalsNavigations = recordMainFrameNavigationPaths(pages.page, originOf('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL'));
    await pages.page.context().clearCookies({ name: authCookieNameFor('animals', animalsBaseUrl) });

    await insPages.notificationType.continueToService();

    await expect(animalsPages.originOfImport.heading).toBeVisible();
    expect(animalsNavigations).toEqual([
      animalsPages.originOfImport.expectedUrl(reference),
      SIGN_IN_PATH,
      SIGN_IN_CALLBACK_PATH,
      animalsPages.originOfImport.expectedUrl(reference),
    ]);
  });
});

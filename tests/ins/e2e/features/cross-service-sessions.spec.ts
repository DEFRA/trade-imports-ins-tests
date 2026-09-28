import { test, expect } from '@fixtures';
import { COLD_START, authCookieNameFor } from '@fixtures/auth-state';
import { requireBaseUrl } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';

test.use({ storageState: COLD_START });

test.describe('Sessions across services', { tag: ['@compose', '@integration'] }, () => {
  test('signing in to animals, then ins, then plants in one browser keeps all three sessions', async ({
    pages,
    animalsPages,
    insPages,
    plantsPages,
  }) => {
    test.slow();
    const animalsBaseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
    const insBaseUrl = requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL');
    const plantsBaseUrl = requireBaseUrl('TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL');

    await animalsPages.dashboard.open();
    await expect(animalsPages.dashboard.heading).toBeVisible();
    await insPages.dashboard.open();
    await expect(insPages.dashboard.heading).toBeVisible();
    await plantsPages.dashboard.open();
    await expect(plantsPages.dashboard.heading).toBeVisible();

    await animalsPages.dashboard.open(false);
    await expect(pages.page).toHaveURL((url) => url.origin === new URL(animalsBaseUrl).origin && url.pathname === SET_BASES.liveAnimals);
    await expect(animalsPages.dashboard.heading).toBeVisible();

    await insPages.dashboard.open(false);
    await expect(pages.page).toHaveURL(
      (url) => url.origin === new URL(insBaseUrl).origin && url.pathname === insPages.dashboard.expectedUrl,
    );
    await expect(insPages.dashboard.heading).toBeVisible();

    await plantsPages.dashboard.open(false);
    await expect(pages.page).toHaveURL((url) => url.origin === new URL(plantsBaseUrl).origin && url.pathname === SET_BASES.highRiskPlants);
    await expect(plantsPages.dashboard.heading).toBeVisible();

    const cookieNames = (await pages.page.context().cookies()).map(({ name }) => name);
    expect(cookieNames).toEqual(
      expect.arrayContaining([
        authCookieNameFor('animals', animalsBaseUrl),
        authCookieNameFor('ins', insBaseUrl),
        authCookieNameFor('plants', plantsBaseUrl),
      ]),
    );
  });
});

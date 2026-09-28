import { test, expect } from '@fixtures';

test.describe('All operator addresses', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  // The api seed unlocks only origin + commodity, so the review page is reached
  // through the full journey walk — the addresses leg of that walk picks the
  // canned parties whose names and countries are asserted here.
  test('check your answers lists all six operators with the picked name and country', async ({ journey, pages }) => {
    test.slow();

    await journey.toReview();

    const card = pages.notificationView.summaryCard('Roles and addresses');
    const operator = (key: string) =>
      card
        .locator('.govuk-summary-list__row')
        .filter({ has: pages.page.locator('dt', { hasText: key }) })
        .locator('.govuk-summary-list__value');

    await expect(operator('Place of origin')).toContainText('Origin Farm');
    await expect(operator('Place of origin')).toContainText('Ireland');

    await expect(operator('Consignor')).toContainText('Astra Rosales');
    await expect(operator('Consignor')).toContainText('Switzerland');

    await expect(operator('Consignee')).toContainText('British Livestock Ltd');
    await expect(operator('Consignee')).toContainText('United Kingdom');

    await expect(operator('Importer')).toContainText('Import Co UK');
    await expect(operator('Importer')).toContainText('United Kingdom');

    await expect(operator('Place of destination')).toContainText('Tech Imports Ltd');
    await expect(operator('Place of destination')).toContainText('United Kingdom');

    await expect(operator('County parish holding (CPH) number')).toContainText('123456789');
  });
});

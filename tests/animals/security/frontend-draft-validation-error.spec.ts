import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, draft)', { tag: '@active' }, () => {
  test('routes a draft validation error through the ZAP proxy', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toOriginOfImport();

    await animalsPages.originOfImport.country.choose('France');
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.originOfImport.errorSummary).toBeVisible();

    await animalsJourney.fillOriginOfImport();
    await animalsJourney.saveOriginOfImport();

    await animalsPages.commoditySelection.heading.waitFor();
  });
});

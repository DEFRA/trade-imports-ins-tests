import { SET_BASES } from '@page-objects/shared/sets';

import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, submitted)', { tag: '@active' }, () => {
  test('routes a submitted notification journey through the ZAP proxy', async ({ animalsJourney, pages, journeyContext }) => {
    test.slow();
    await animalsJourney.submitNotification();

    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyContext.journeyId}/confirmation$`));
  });
});

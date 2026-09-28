import { SET_BASES } from '@page-objects/base/sets';

import { test, expect } from '@fixtures';

test(
  'submits a promoted live-animals notification through the hub-owned spine',
  { tag: ['@compose', '@integration'] },
  async ({ journey, pages, journeyContext }) => {
    test.slow();
    await journey.submitNotification();

    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyContext.journeyId}/confirmation$`));
    await expect(pages.page.locator('.govuk-panel')).toContainText(journeyContext.journeyId);
  },
);

import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import { createPlantsPages } from '@page-objects';
import { expectPageNotFound } from '@page-objects/shared/page-not-found';
import { users } from '@config/users';

test.describe('Another organisation opens a notification by its URL', () => {
  test('shows page not found and none of the notification', async ({ browser, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();

    const sarahsContext = await browser.newContext({ storageState: COLD_START });
    try {
      const sarahsPages = createPlantsPages(await sarahsContext.newPage());
      await sarahsPages.commodityType.open(reference, {
        userId: users.sarah.crn,
        organisationSbi: users.sarah.organisations.farmsLtd,
      });

      const page = sarahsPages.commodityType.heading.page();
      await expectPageNotFound(page);
      await expect(sarahsPages.commodityType.heading).toBeHidden();
      await expect(page.getByText(reference)).toBeHidden();
    } finally {
      await sarahsContext.close();
    }
  });
});

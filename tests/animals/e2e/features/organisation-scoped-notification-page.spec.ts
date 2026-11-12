import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import { createAnimalsPages } from '@page-objects';
import { users } from '@config/users';

test.describe('Another organisation opens a notification by its URL', () => {
  test('shows page not found and none of the notification', async ({ browser, animalsJourney }) => {
    const reference = await animalsJourney.startNotification();

    const sarahsContext = await browser.newContext({ storageState: COLD_START });
    try {
      const sarahsPages = createAnimalsPages(await sarahsContext.newPage());
      await sarahsPages.overview.open(reference, {
        userId: users.sarah.crn,
        organisationSbi: users.sarah.organisations.farmsLtd,
      });

      const page = sarahsPages.overview.heading.page();
      await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
      await expect(page.getByText('Page not found', { exact: true })).toBeVisible();
      await expect(sarahsPages.overview.heading).toBeHidden();
      await expect(page.getByText(reference)).toBeHidden();
    } finally {
      await sarahsContext.close();
    }
  });
});

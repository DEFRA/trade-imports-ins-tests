import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';

// INS's one real redirect-to-sign-in-and-return test, so it starts unauthenticated.
test.use({ storageState: COLD_START });

test.describe('Authentication (ins)', { tag: '@auth' }, () => {
  test.beforeEach(async ({ journey, pages }) => {
    await journey.toSignIn((attemptSignIn) => pages.insAddressBookAdd.open(attemptSignIn));
  });

  test('lands on the sign in page when opening a page past the address book landing page', async ({ pages }) => {
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.heading).toBeVisible();
  });

  test('allows signing into a page past the address book landing page', async ({ pages }) => {
    await pages.signIn.signIn();
    await expect(pages.page).toHaveURL(new RegExp(`${pages.insAddressBookAdd.expectedUrl}$`));
    await expect(pages.insAddressBookAdd.heading).toBeVisible();
  });
});

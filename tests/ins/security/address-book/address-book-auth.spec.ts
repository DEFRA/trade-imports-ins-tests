import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';

// This spec IS the sign-in journey, so it starts unauthenticated.
test.use({ storageState: COLD_START });

test.describe('Security scan (ins, auth)', { tag: '@active' }, () => {
  test('routes the sign-in redirect round trip through the ZAP proxy', async ({ journey, pages, insPages }) => {
    // /auth/sign-in and /auth/sign-in-oidc are documented as in scope
    // (docs/security.md) but every other spec here starts pre-authenticated.
    await journey.toSignIn((attemptSignIn) => insPages.addressBookAdd.open(attemptSignIn));
    await expect(pages.signIn.heading).toBeVisible();

    await pages.signIn.signIn({ userId: 'invalid' });
    await expect(pages.signIn.errorSummary).toBeVisible();

    await pages.signIn.signIn();
    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookAdd.expectedUrl}$`));
    await expect(insPages.addressBookAdd.heading).toBeVisible();

    // No other spec proves INS renders a sign-out link — check this first if
    // the step below starts failing, before assuming the route moved.
    await insPages.addressBookAdd.linkSignOut.click();
    await expect(pages.signOut.heading).toBeVisible();
  });
});

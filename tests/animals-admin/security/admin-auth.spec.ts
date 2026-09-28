import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';

// This spec IS the sign-in journey, so it starts unauthenticated.
test.use({ storageState: COLD_START });

test.describe('Security scan (admin, auth)', { tag: '@active' }, () => {
  test('routes the sign-in redirect round trip through the ZAP proxy', async ({ journey, pages, animalsAdminPages }) => {
    // /auth/sign-in and /auth/sign-in-oidc are documented as in scope
    // (docs/security.md) but every other spec here starts pre-authenticated.
    await journey.toSignIn((attemptSignIn) => animalsAdminPages.dashboard.open(attemptSignIn));
    await expect(pages.signIn.heading).toBeVisible();

    await pages.signIn.signIn({ password: '' });
    await expect(pages.signIn.errorSummary).toBeVisible();

    await pages.signIn.signIn();
    await expect(pages.page).toHaveURL(animalsAdminPages.dashboard.expectedUrl);
    await expect(animalsAdminPages.dashboard.heading).toBeVisible();

    await animalsAdminPages.dashboard.linkSignOut.click();
    await expect(pages.signOut.heading).toBeVisible();
  });
});

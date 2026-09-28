import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';

// These tests ARE the sign-in journey, so they start unauthenticated.
test.use({ storageState: COLD_START });

test.describe('Authentication (admin)', { tag: '@auth' }, () => {
  test.beforeEach(async ({ animalsJourney, animalsAdminPages }) => {
    await animalsJourney.toSignIn((attemptSignIn) => animalsAdminPages.dashboard.open(attemptSignIn));
  });

  test('lands on the sign in page when opening the admin dashboard', async ({ pages }) => {
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.heading).toBeVisible();
  });

  test('allows signing into the admin dashboard', { tag: '@smoke' }, async ({ pages, animalsAdminPages }) => {
    await pages.signIn.signIn();
    await expect(pages.page).toHaveURL(animalsAdminPages.dashboard.expectedUrl);
    await expect(animalsAdminPages.dashboard.heading).toBeVisible();
  });

  test('displays an error message when signing in with empty credentials', async ({ pages }) => {
    await pages.signIn.signIn({ userId: '', password: '' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText('Enter a valid 10-digit customer reference number (CRN) and password');
  });

  test('displays an error message when signing in with empty password', async ({ pages }) => {
    await pages.signIn.signIn({ password: '' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText('Enter a valid 10-digit customer reference number (CRN) and password');
  });

  test('allows signing out after signing in', async ({ pages, animalsAdminPages }) => {
    await pages.signIn.signIn();
    await animalsAdminPages.dashboard.linkSignOut.click();
    await expect(pages.page).toHaveURL(pages.signOut.expectedUrl);
    await expect(pages.signOut.heading).toBeVisible();
  });

  test('displays signed in user after signing in', async ({ pages, animalsAdminPages }) => {
    await pages.signIn.signIn();
    await expect(animalsAdminPages.dashboard.user()).toBeVisible();
  });

  test('lands on the sign in page when reopening the admin dashboard after sign out', async ({ pages, animalsAdminPages }) => {
    await pages.signIn.signIn();
    await animalsAdminPages.dashboard.linkSignOut.click();
    await animalsAdminPages.dashboard.open(false);
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.heading).toBeVisible();
  });

  test.describe('Notifications (admin) (unauthenticated entry)', () => {
    test.beforeEach(async ({ animalsJourney, animalsAdminPages }) => {
      await animalsJourney.toSignIn((attemptSignIn) => animalsAdminPages.notifications.open(attemptSignIn));
    });

    test('lands on the sign in page when opening a page further in the journey', async ({ pages }) => {
      await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
      await expect(pages.signIn.heading).toBeVisible();
    });

    test('allows signing into a page further in the journey', async ({ pages, animalsAdminPages }) => {
      await pages.signIn.signIn();
      await expect(pages.page).toHaveURL(animalsAdminPages.notifications.expectedUrl);
      await expect(animalsAdminPages.notifications.heading).toBeVisible();
    });
  });
});

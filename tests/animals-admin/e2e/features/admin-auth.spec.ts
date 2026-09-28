import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';

// These tests ARE the sign-in journey, so they start unauthenticated.
test.use({ storageState: COLD_START });

test.describe('Authentication (admin)', { tag: '@auth' }, () => {
  test.beforeEach(async ({ journey, pages }) => {
    await journey.toSignIn((attemptSignIn) => pages.adminDashboard.open(attemptSignIn));
  });

  test('lands on the sign in page when opening the admin dashboard', async ({ pages }) => {
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.heading).toBeVisible();
  });

  test('allows signing into the admin dashboard', { tag: '@smoke' }, async ({ pages }) => {
    await pages.signIn.signIn();
    await expect(pages.page).toHaveURL(pages.adminDashboard.expectedUrl);
    await expect(pages.adminDashboard.heading).toBeVisible();
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

  test('allows signing out after signing in', async ({ pages }) => {
    await pages.signIn.signIn();
    await pages.adminDashboard.linkSignOut.click();
    await expect(pages.page).toHaveURL(pages.signOut.expectedUrl);
    await expect(pages.signOut.heading).toBeVisible();
  });

  test('displays signed in user after signing in', async ({ pages }) => {
    await pages.signIn.signIn();
    await expect(pages.adminDashboard.user()).toBeVisible();
  });

  test('lands on the sign in page when reopening the admin dashboard after sign out', async ({ pages }) => {
    await pages.signIn.signIn();
    await pages.adminDashboard.linkSignOut.click();
    await pages.adminDashboard.open(false);
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.heading).toBeVisible();
  });

  test.describe('Notifications (admin) (unauthenticated entry)', () => {
    test.beforeEach(async ({ journey, pages }) => {
      await journey.toSignIn((attemptSignIn) => pages.adminNotifications.open(attemptSignIn));
    });

    test('lands on the sign in page when opening a page further in the journey', async ({ pages }) => {
      await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
      await expect(pages.signIn.heading).toBeVisible();
    });

    test('allows signing into a page further in the journey', async ({ pages }) => {
      await pages.signIn.signIn();
      await expect(pages.page).toHaveURL(pages.adminNotifications.expectedUrl);
      await expect(pages.adminNotifications.heading).toBeVisible();
    });
  });
});

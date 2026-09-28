import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';

const GENERIC_INVALID_CREDENTIALS = 'Enter a valid 10-digit customer reference number (CRN) and password';

// These tests ARE the plants sign-in journey, so they start unauthenticated.
test.use({ storageState: COLD_START });

test.describe('Authentication (plants)', { tag: ['@auth', '@integration'] }, () => {
  test.beforeEach(async ({ journey, pages }) => {
    await journey.toSignIn((attemptSignIn) => pages.plantsDashboard.open(attemptSignIn));
  });

  test('displays an error message when signing in with invalid user id', async ({ pages }) => {
    await pages.signIn.signIn({ userId: 'invalid' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText(GENERIC_INVALID_CREDENTIALS);
  });

  test('displays an error message when signing in with invalid password', async ({ pages }) => {
    await pages.signIn.signIn({ password: 'invalid' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText(GENERIC_INVALID_CREDENTIALS);
  });
});

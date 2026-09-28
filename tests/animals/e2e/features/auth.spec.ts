import { SET_BASES } from '@page-objects/shared/sets';

import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';

// These tests ARE the sign-in journey, so they start unauthenticated.
test.use({ storageState: COLD_START });

test.describe('Authentication', { tag: ['@auth', '@integration'] }, () => {
  test.beforeEach(async ({ journey, animalsPages }) => {
    await journey.toSignIn((attemptSignIn) => animalsPages.dashboard.open(attemptSignIn));
  });

  test('lands on the sign in page when opening the notification dashboard', async ({ pages }) => {
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.heading).toBeVisible();
  });

  test('allows signing into the notification dashboard', { tag: '@smoke' }, async ({ pages, animalsPages }) => {
    await pages.signIn.signIn();
    await expect(pages.page).toHaveURL(animalsPages.dashboard.expectedUrl);
    await expect(animalsPages.dashboard.heading).toBeVisible();
  });

  test('displays an error message when signing in with invalid user id', async ({ pages }) => {
    await pages.signIn.signIn({ userId: 'invalid' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText('Enter a valid 10-digit customer reference number (CRN) and password');
  });

  test('displays an error message when signing in with invalid password', async ({ pages }) => {
    await pages.signIn.signIn({ password: 'invalid' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText('Enter a valid 10-digit customer reference number (CRN) and password');
  });

  // No set is served at the root any more, so `/` is a server-wide redirect to
  // the default set. This is the path a user takes with no stored redirect —
  // signing in and being put somewhere sensible rather than nowhere.
  test('redirects the service root to the default set’s dashboard', async ({ pages, animalsPages }) => {
    await pages.signIn.signIn();
    await pages.page.goto('/');
    await expect(pages.page).toHaveURL(SET_BASES.liveAnimals);
    await expect(animalsPages.dashboard.heading).toBeVisible();
  });

  test('allows signing out after signing in', async ({ pages, animalsPages }) => {
    await pages.signIn.signIn();
    await expect(animalsPages.dashboard.linkSignOut).toHaveAttribute('href', pages.signOut.path);
    await animalsPages.dashboard.linkSignOut.click();
    await expect(pages.page).toHaveURL(pages.signOut.expectedUrl);
    await expect(pages.signOut.heading).toBeVisible();
  });

  // Design release 1 shows no signed-in identity: the email address and the strip that carried it are gone,
  // and sign-out lives in the service navigation as "Log out". Asserting the absence keeps that decision covered.
  test('does not display the signed in user after signing in', async ({ pages, animalsPages }) => {
    await pages.signIn.signIn();
    await expect(animalsPages.dashboard.user()).toHaveCount(0);
  });

  test('lands on the sign in page when reopening the notification dashboard after sign out', async ({ pages, animalsPages }) => {
    await pages.signIn.signIn();
    await animalsPages.dashboard.linkSignOut.click();
    await pages.signOut.heading.waitFor();
    await animalsPages.dashboard.open(false);
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.heading).toBeVisible();
  });

  test.describe('Origin of the import (unauthenticated entry)', () => {
    let journeyId: string;

    test.beforeEach(async ({ pages, animalsPages }) => {
      await pages.signIn.signIn();
      await animalsPages.dashboard.btnCreateNewNotification.click();
      journeyId = animalsPages.originOfImport.journeyIdFromUrl();
      await animalsPages.originOfImport.selectCountry('France');
      await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
      await animalsPages.originOfImport.saveAndContinue.click();
      const journeyCookies = (await pages.page.context().cookies()).filter(({ name }) => name.startsWith('liveAnimals'));
      await pages.page.context().clearCookies();
      await pages.page.context().addCookies(journeyCookies);
      await animalsPages.originOfImport.open(journeyId, false);
    });

    test('lands on the sign in page when opening a page further in the journey', async ({ pages }) => {
      await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
      await expect(pages.signIn.heading).toBeVisible();
    });

    test('allows signing into a page further in the journey', async ({ pages, animalsPages }) => {
      await pages.signIn.signIn();
      await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyId}/origin$`));
      await expect(animalsPages.originOfImport.heading).toBeVisible();
    });
  });
});

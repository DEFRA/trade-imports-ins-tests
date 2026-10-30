import { test, expect } from '@fixtures';

/**
 * Integration seam: an operator in the admin app can find what a user submitted in the animals journey.
 *
 * The admin app reads notifications through animals-backend, so this proves the two apps agree on the
 * notification the journey wrote. The notification is only looked up, never deleted: the admin domain's
 * own specs cover the delete actions.
 */
test.describe('Admin visibility of animals notifications', () => {
  test(
    'a notification submitted in the animals journey is listed in the admin app',
    { tag: '@animals-admin' },
    async ({ animalsSeededJourney, animalsAdminNavigation, animalsAdminPages }) => {
      test.slow();
      const referenceNumber = await animalsSeededJourney.createSubmittedNotification();

      await animalsAdminNavigation.toNotifications();
      await animalsAdminPages.notifications.openPageShowingNotification(referenceNumber);

      await expect(animalsAdminPages.notifications.tableRowByReference(referenceNumber)).toBeVisible();
    },
  );
});

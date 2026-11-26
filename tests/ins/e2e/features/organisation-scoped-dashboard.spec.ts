import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import { createInsPages } from '@page-objects';
import { timeouts } from '@config/timeouts';
import { users } from '@config/users';

test.describe(
  'Organisation-scoped INS dashboard',
  {
    tag: ['@animals-backend', '@animals-frontend'],
  },
  () => {
    test('the INS notification list returns none of this notification to another organisation searching by its reference', async ({
      animalsJourney,
      journeyContext,
      insNotificationApi,
      otherOrganisationInsNotificationApi,
    }) => {
      test.slow();

      await animalsJourney.submitNotification();
      const referenceNumber = journeyContext.referenceNumber;

      await expect
        .poll(() => insNotificationApi.countByReference(referenceNumber), {
          timeout: timeouts.long,
        })
        .toBe(1);

      expect(await otherOrganisationInsNotificationApi.countByReference(referenceNumber)).toBe(0);
    });

    test('the INS dashboard of another organisation lists none of this notification and answers a search for its reference with No notifications found', async ({
      browser,
      animalsJourney,
      journeyContext,
      insPages,
      insNotificationApi,
    }) => {
      test.slow();

      await animalsJourney.submitNotification();
      const referenceNumber = journeyContext.referenceNumber;

      await expect
        .poll(() => insNotificationApi.countByReference(referenceNumber), {
          timeout: timeouts.long,
        })
        .toBe(1);

      await insPages.dashboard.open();
      await insPages.dashboard.searchForReference(referenceNumber);
      await expect(insPages.dashboard.row(referenceNumber)).toHaveCount(1);

      const otherOrganisationContext = await browser.newContext({ storageState: COLD_START });
      try {
        const otherOrganisationInsPages = createInsPages(await otherOrganisationContext.newPage());

        await otherOrganisationInsPages.dashboard.open({
          userId: users.sarah.crn,
          organisationSbi: users.sarah.organisations.farmsLtd,
        });
        await expect(otherOrganisationInsPages.dashboard.row(referenceNumber)).toHaveCount(0);

        await otherOrganisationInsPages.dashboard.searchForReference(referenceNumber);
        await expect(otherOrganisationInsPages.dashboard.noSearchResults).toHaveText('No notifications found');
        await expect(otherOrganisationInsPages.dashboard.row(referenceNumber)).toHaveCount(0);
      } finally {
        await otherOrganisationContext.close();
      }
    });
  },
);

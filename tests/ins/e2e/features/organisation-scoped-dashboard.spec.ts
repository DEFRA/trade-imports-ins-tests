import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';

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
  },
);

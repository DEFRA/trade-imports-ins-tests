import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';
import { ensureE2eAddressBook } from '@flows/shared/address-book-seed';

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
      addressBookApi,
    }) => {
      test.slow();

      // The journey picks its five parties from the address book, and each
      // picker lists only its own role's addresses, so a book short of one
      // leaves that page with nothing to choose. Only the compose config runs
      // the global seed, so against a deployed environment this spec seeds
      // itself.
      await ensureE2eAddressBook(addressBookApi);

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

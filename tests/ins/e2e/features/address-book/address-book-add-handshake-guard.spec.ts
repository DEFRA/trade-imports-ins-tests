import { test, expect } from '@fixtures';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { unregisteredJourneyHandshake } from '@domain/ins/constants/address-book-journey';

test.describe('INS address book add handshake guard', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('INS handshake routes are only exercised against the compose stack');
  });

  test('refuses an unrecognised journey type', async ({ pages, insPages }) => {
    await insPages.addressBookAdd.open({ query: unregisteredJourneyHandshake });

    await expect(pages.page.getByText('Page not found')).toBeVisible();
  });
});

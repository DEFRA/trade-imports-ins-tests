import { test, expect } from '@fixtures';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('INS address book add handshake guard', { tag: ['@integration'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('INS handshake routes are only exercised against the compose stack');
  });

  test('refuses an unrecognised journey type', async ({ pages }) => {
    await pages.page.goto(
      '/address-book/add?journey-type=not-a-journey&notification-id=GBN-AG-26-4F7K2P&fulfilment-id=9ad1e2f3-a4b5-4c60-8d1c-9e0f1a2b3c4d&handshake-token=handshake-token-value',
    );

    await expect(pages.page.getByText('Page not found')).toBeVisible();
  });
});

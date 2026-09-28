import { test, expect } from '@fixtures';
import { skipIfNonStubStackEnvironment, skipUnlessNonStubStackEnvironment } from '@utils/playwright/environment';

test.describe('Contact address page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toContactAddress();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.contactAddress.heading).toBeVisible();
    await expect(pages.contactAddress.address('Animal and Plant Health Agency')).toBeVisible();
    await expect(pages.contactAddress.saveAndContinue).toBeVisible();
  });

  test('leaves the contact address unchecked on load', async ({ pages }) => {
    await expect(pages.contactAddress.address('Animal and Plant Health Agency')).not.toBeChecked();
  });

  test('accepts a valid contact address', async ({ pages }) => {
    await pages.contactAddress.address('Animal and Plant Health Agency').check();
    await pages.contactAddress.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('saving with no contact address selected is allowed and exits to the hub', async ({ pages }) => {
    await pages.contactAddress.saveAndContinue.click();

    await expect(pages.overview.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('offers no way to add an address in stub mode', async ({ pages }) => {
    skipIfNonStubStackEnvironment('the INS add link is shown when animals-frontend runs outside stub mode (compose or CDP)');
    await expect(pages.page.getByRole('link', { name: /add.*address/i })).toHaveCount(0);
  });

  test('links to INS to add an address when the full stack is running', async ({ pages }) => {
    skipUnlessNonStubStackEnvironment('the handshake link is only rendered outside stub mode (compose or CDP)');
    await expect(pages.page.getByRole('link', { name: /add.*address/i })).toHaveAttribute(
      'href',
      /\/address-book\/add\?journey-type=gbn-ag/,
    );
  });
});

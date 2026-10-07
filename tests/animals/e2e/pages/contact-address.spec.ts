import { test, expect } from '@fixtures';
import { skipIfNonStubStackEnvironment, skipUnlessNonStubStackEnvironment } from '@utils/playwright/environment';

test.describe('Contact address page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toContactAddress();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.contactAddress.address('Animal and Plant Health Agency')).toBeVisible();
    await expect(animalsPages.contactAddress.saveAndContinue).toBeVisible();
  });

  test('leaves the contact address unchecked on load', async ({ animalsPages }) => {
    await expect(animalsPages.contactAddress.address('Animal and Plant Health Agency')).not.toBeChecked();
  });

  test('accepts a valid contact address', async ({ pages, animalsPages }) => {
    await animalsPages.contactAddress.address('Animal and Plant Health Agency').check();
    await animalsPages.contactAddress.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('a chosen contact address is shown as the current contact on return, still chosen, and saving again keeps it', async ({
    pages,
    animalsPages,
  }) => {
    const contact = 'Animal and Plant Health Agency';
    await animalsPages.contactAddress.address(contact).check();
    await animalsPages.contactAddress.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await animalsPages.overview.task('Contact address for this consignment').click();
    await expect(animalsPages.contactAddress.currentContact).toContainText(contact);
    await expect(animalsPages.contactAddress.editCurrentContact).toBeVisible();
    await expect(animalsPages.contactAddress.address(contact)).toBeChecked();

    await animalsPages.contactAddress.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Contact address for this consignment').click();
    await expect(animalsPages.contactAddress.currentContact).toContainText(contact);
  });

  test('saving with no contact address selected is allowed and exits to the hub', async ({ pages, animalsPages }) => {
    await animalsPages.contactAddress.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
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

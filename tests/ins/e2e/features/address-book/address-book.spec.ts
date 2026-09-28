import { test, expect } from '@fixtures';

test.describe('Address book', { tag: '@integration' }, () => {
  test('renders the address book after signing in', { tag: '@smoke' }, async ({ pages }) => {
    await pages.insAddressBookList.open();

    await expect(pages.page).toHaveURL(new RegExp(`${pages.insAddressBookList.expectedUrl}$`));
    await expect(pages.insAddressBookList.heading).toBeVisible();
    await expect(pages.insAddressBookList.errorSummary).not.toBeVisible();
  });
});

import { test, expect } from '@fixtures';

test.describe('Address book', { tag: '@integration' }, () => {
  test('renders the address book after signing in', { tag: '@smoke' }, async ({ pages, insPages }) => {
    await insPages.addressBookList.open();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
    await expect(insPages.addressBookList.heading).toBeVisible();
    await expect(insPages.addressBookList.errorSummary).not.toBeVisible();
  });
});

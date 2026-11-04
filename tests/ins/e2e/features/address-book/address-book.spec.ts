import { test, expect } from '@fixtures';
import { expectAddressBookList } from './expect-address-book-list';

test.describe('Address book', () => {
  test('renders the address book after signing in', { tag: '@smoke' }, async ({ pages, insPages }) => {
    await insPages.addressBookList.open();

    await expectAddressBookList({ pages, insPages });
    await expect(insPages.addressBookList.errorSummary).not.toBeVisible();
  });
});

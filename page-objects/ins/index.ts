import { type Page } from '@playwright/test';
import { InsAddressBookAddPage } from '@page-objects/ins/address-book/add-page';
import { InsAddressBookDeletePage } from '@page-objects/ins/address-book/delete-page';
import { InsAddressBookEditPage } from '@page-objects/ins/address-book/edit-page';
import { InsAddressBookListPage } from '@page-objects/ins/address-book/list-page';
import { InsAddressBookViewPage } from '@page-objects/ins/address-book/view-page';
import { InsDashboardPage } from '@page-objects/ins/dashboard-page';

export function createInsPages(page: Page) {
  return {
    dashboard: new InsDashboardPage(page),
    addressBookList: new InsAddressBookListPage(page),
    addressBookAdd: new InsAddressBookAddPage(page),
    addressBookView: new InsAddressBookViewPage(page),
    addressBookEdit: new InsAddressBookEditPage(page),
    addressBookDelete: new InsAddressBookDeletePage(page),
  };
}

export type InsPages = ReturnType<typeof createInsPages>;

import { type Page } from '@playwright/test';
import { InsAddressBookAddPage } from '@page-objects/ins/address-book/add-page';
import { InsAddressBookAddressTypePage } from '@page-objects/ins/address-book/address-type-page';
import { InsAddressBookDeletePage } from '@page-objects/ins/address-book/delete-page';
import { InsAddressBookEditPage } from '@page-objects/ins/address-book/edit-page';
import { InsAddressBookListPage } from '@page-objects/ins/address-book/list-page';
import { InsAddressBookViewPage } from '@page-objects/ins/address-book/view-page';
import { InsAddressBookTransporterViewPage } from '@page-objects/ins/address-book/transporter-view-page';
import { InsTransporterTypePage } from '@page-objects/ins/address-book/transporter-type-page';
import { InsPrivateTransporterPage } from '@page-objects/ins/address-book/private-transporter-page';
import { InsCommercialTransporterPage } from '@page-objects/ins/address-book/commercial-transporter-page';
import { InsDashboardPage } from '@page-objects/ins/dashboard-page';
import { InsNotificationTypePage } from '@page-objects/ins/notification-type-page';

export function createInsPages(page: Page) {
  return {
    dashboard: new InsDashboardPage(page),
    notificationType: new InsNotificationTypePage(page),
    addressBookList: new InsAddressBookListPage(page),
    addressBookAdd: new InsAddressBookAddPage(page),
    addressBookAddressType: new InsAddressBookAddressTypePage(page),
    addressBookView: new InsAddressBookViewPage(page),
    addressBookTransporterView: new InsAddressBookTransporterViewPage(page),
    addressBookEdit: new InsAddressBookEditPage(page),
    addressBookDelete: new InsAddressBookDeletePage(page),
    transporterType: new InsTransporterTypePage(page),
    privateTransporter: new InsPrivateTransporterPage(page),
    commercialTransporter: new InsCommercialTransporterPage(page),
  };
}

export type InsPages = ReturnType<typeof createInsPages>;

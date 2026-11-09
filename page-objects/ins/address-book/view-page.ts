import { Locator } from '@playwright/test';
import { InsAddressBookRecordPage } from '@page-objects/ins/address-book/record-page';

export class InsAddressBookViewPage extends InsAddressBookRecordPage {
  expectedUrl(addressId: string): string {
    return `/address-book/${addressId}`;
  }

  heading(addressName: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: addressName });
  }

  get btnEdit(): Locator {
    return this.page.getByRole('button', { name: 'Edit' });
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete' });
  }
}

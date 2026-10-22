import { Locator } from '@playwright/test';
import { InsAddressBookAddressPage } from '@page-objects/ins/address-book/address-page';

export class InsAddressBookViewPage extends InsAddressBookAddressPage {
  expectedUrl(addressId: string): string {
    return `/address-book/${addressId}`;
  }

  /** The page is headed by the address's own name. */
  heading(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name });
  }

  get btnEdit(): Locator {
    return this.page.getByRole('button', { name: 'Edit' });
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete' });
  }
}

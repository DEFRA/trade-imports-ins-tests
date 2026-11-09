import { Locator } from '@playwright/test';
import { InsAddressBookRecordPage } from '@page-objects/ins/address-book/record-page';

export class InsAddressBookDeletePage extends InsAddressBookRecordPage {
  expectedUrl(addressId: string): string {
    return `/address-book/${addressId}/delete`;
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Delete this address?' });
  }

  get confirmation(): Locator {
    return this.page.getByText('Confirm that you want to delete this address.');
  }

  get warning(): Locator {
    return this.page.getByText('Deletions are permanent and you cannot undo this.');
  }

  get btnConfirm(): Locator {
    return this.page.getByRole('button', { name: 'Yes, delete', exact: true });
  }

  get linkCancel(): Locator {
    return this.page.getByRole('link', { name: 'No, cancel' });
  }

  async confirm(): Promise<void> {
    await this.btnConfirm.click();
  }

  async cancel(): Promise<void> {
    await this.linkCancel.click();
  }
}

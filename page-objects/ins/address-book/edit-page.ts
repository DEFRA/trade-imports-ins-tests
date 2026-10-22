import { Locator } from '@playwright/test';
import { type OpenOptions } from '@page-objects/shared/base-page';
import { urlWithReturn } from '@page-objects/ins/address-book/url-with-return';
import { InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';

export class InsAddressBookEditPage extends InsAddressBookFormPage {
  expectedUrl(addressId: string): string {
    return `/address-book/${addressId}/edit`;
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Edit address and contact details' });
  }

  get btnSaveChanges(): Locator {
    return this.page.getByRole('button', { name: 'Save changes' });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  async open(addressId: string, { attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
    await this.page.goto(this.expectedUrl(addressId));
    await this.signInWhenRequested(attemptSignIn, identity);
  }

  async openWithReturn(addressId: string, returnTo: string): Promise<void> {
    await this.page.goto(urlWithReturn(this.expectedUrl(addressId), returnTo));
    await this.completeSignInIfRequested();
  }

  async save(): Promise<void> {
    await this.btnSaveChanges.click();
  }
}

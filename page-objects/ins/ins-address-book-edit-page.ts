import { Locator } from '@playwright/test';
import { InsAddressBookFormPage } from '@page-objects/ins/ins-address-book-form-page';

export class InsAddressBookEditPage extends InsAddressBookFormPage {
  expectedUrl(addressId: string): string {
    return `/address-book/${addressId}/edit`;
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Edit address details' });
  }

  get btnSaveChanges(): Locator {
    return this.page.getByRole('button', { name: 'Save changes' });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  async open(addressId: string, attemptSignIn: boolean = true, options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    await this.page.goto(this.expectedUrl(addressId));
    await this.signInWhenRequested(attemptSignIn, options);
  }

  async save(): Promise<void> {
    await this.btnSaveChanges.click();
  }
}

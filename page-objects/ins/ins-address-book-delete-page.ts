import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class InsAddressBookDeletePage extends BasePage {
  expectedUrl(addressId: string): string {
    return `/address-book/${addressId}/delete`;
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Delete address' });
  }

  get btnConfirm(): Locator {
    return this.page.getByRole('button', { name: 'Yes, delete this address' });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  async open(addressId: string, attemptSignIn: boolean = true, options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    await this.page.goto(this.expectedUrl(addressId));
    await this.signInWhenRequested(attemptSignIn, options);
  }

  async confirm(): Promise<void> {
    await this.btnConfirm.click();
  }
}

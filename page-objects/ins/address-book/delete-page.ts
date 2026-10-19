import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';

export class InsAddressBookDeletePage extends BasePage {
  expectedUrl(addressId: string): string {
    return `/address-book/${addressId}/delete`;
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Delete this address?' });
  }

  /** The summary-list labels. */
  get terms(): Locator {
    return this.page.getByRole('term');
  }

  /** The summary-list values. */
  get values(): Locator {
    return this.page.getByRole('definition');
  }

  get confirmation(): Locator {
    return this.page.getByText('Confirm that you want to delete this address.');
  }

  get warning(): Locator {
    return this.page.getByText('This action cannot be undone.');
  }

  get btnConfirm(): Locator {
    return this.page.getByRole('button', { name: 'Yes, delete', exact: true });
  }

  get linkCancel(): Locator {
    return this.page.getByRole('link', { name: 'No, cancel' });
  }

  async open(addressId: string, attemptSignIn: boolean = true, options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    await this.page.goto(this.expectedUrl(addressId));
    await this.signInWhenRequested(attemptSignIn, options);
  }

  async confirm(): Promise<void> {
    await this.btnConfirm.click();
  }

  async cancel(): Promise<void> {
    await this.linkCancel.click();
  }
}

import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class InsAddressBookViewPage extends BasePage {
  expectedUrl(addressId: string): string {
    return `/address-book/${addressId}`;
  }

  /** The page is headed by the address's own name. */
  heading(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name });
  }

  /** The summary-list values, in the order the Standard Address Block is rendered. */
  get values(): Locator {
    return this.page.getByRole('definition');
  }

  get btnEdit(): Locator {
    return this.page.getByRole('button', { name: 'Edit' });
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete' });
  }

  async open(addressId: string, attemptSignIn: boolean = true, options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    await this.page.goto(this.expectedUrl(addressId));
    await this.signInWhenRequested(attemptSignIn, options);
  }
}

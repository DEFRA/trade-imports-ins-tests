import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';

export class InsAddressBookViewPage extends BasePage {
  expectedUrl(addressId: string): string {
    return `/address-book/${addressId}`;
  }

  /** The page's path with a `return` query naming where the user came from. */
  expectedUrlWithReturn(addressId: string, returnTo: string): string {
    return `${this.expectedUrl(addressId)}?return=${encodeURIComponent(returnTo)}`;
  }

  /** The page is headed by the address's own name. */
  heading(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name });
  }

  /** The summary-list values, in the order the Standard Address Block is rendered. */
  get values(): Locator {
    return this.page.getByRole('definition');
  }

  /** The summary-list labels, in the order the Standard Address Block is rendered. */
  get terms(): Locator {
    return this.page.getByRole('term');
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

  /** Opens the page on the INS frontend's own origin, so it works from a spec in another domain. */
  async openWithReturn(
    addressId: string,
    returnTo: string,
    attemptSignIn: boolean = true,
    options?: { userId?: string; organisationSbi?: string },
  ): Promise<void> {
    await this.navigateToInsFrontend(this.expectedUrlWithReturn(addressId, returnTo));
    await this.signInWhenRequested(attemptSignIn, options);
  }
}

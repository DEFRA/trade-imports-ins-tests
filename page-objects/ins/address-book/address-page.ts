import { Locator } from '@playwright/test';
import { BasePage, type OpenOptions } from '@page-objects/shared/base-page';
import { urlWithReturn } from '@page-objects/ins/address-book/url-with-return';

export abstract class InsAddressBookAddressPage extends BasePage {
  abstract expectedUrl(addressId: string): string;

  get summaryListKeys(): Locator {
    return this.page.getByRole('term');
  }

  get summaryListValues(): Locator {
    return this.page.getByRole('definition');
  }

  async open(addressId: string, { attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
    await this.navigateToInsFrontend(this.expectedUrl(addressId));
    await this.signInWhenRequested(attemptSignIn, identity);
  }

  async openWithReturn(addressId: string, returnTo: string): Promise<void> {
    await this.navigateToInsFrontend(urlWithReturn(this.expectedUrl(addressId), returnTo));
    await this.completeSignInIfRequested();
  }
}

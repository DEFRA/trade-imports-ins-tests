import { Locator } from '@playwright/test';
import { BasePage, type OpenOptions } from '@page-objects/shared/base-page';

export abstract class InsAddressBookAddressPage extends BasePage {
  abstract expectedUrl(addressId: string): string;

  expectedUrlWithReturn(addressId: string, returnTo: string): string {
    return `${this.expectedUrl(addressId)}?return=${encodeURIComponent(returnTo)}`;
  }

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
    await this.navigateToInsFrontend(this.expectedUrlWithReturn(addressId, returnTo));
    await this.completeSignInIfRequested();
  }
}

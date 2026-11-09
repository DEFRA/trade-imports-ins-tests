import { Locator } from '@playwright/test';
import { BasePage, type OpenOptions } from '@page-objects/shared/base-page';
import { urlWithReturn } from '@page-objects/ins/address-book/url-with-return';

export abstract class InsAddressBookRecordPage extends BasePage {
  abstract expectedUrl(recordId: string): string;

  get summaryListKeys(): Locator {
    return this.page.getByRole('term');
  }

  get summaryListValues(): Locator {
    return this.page.getByRole('definition');
  }

  async open(recordId: string, { attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
    await this.navigateToInsFrontend(this.expectedUrl(recordId));
    await this.signInWhenRequested(attemptSignIn, identity);
  }

  async openWithReturn(recordId: string, returnTo: string): Promise<void> {
    await this.navigateToInsFrontend(urlWithReturn(this.expectedUrl(recordId), returnTo));
    await this.completeSignInIfRequested();
  }
}

import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class InsAddressBookListPage extends BasePage {
  readonly expectedUrl = '/address-book';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Address book' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }

  get emptyState(): Locator {
    return this.page.getByText('You have no addresses yet.');
  }

  get linkAddNewAddress(): Locator {
    return this.page.getByRole('link', { name: 'Add a new address' });
  }

  get successBanner(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'Success' }) });
  }

  row(name: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(name) });
  }

  async open(attemptSignIn: boolean = true, options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    await this.page.goto(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn, options);
  }
}

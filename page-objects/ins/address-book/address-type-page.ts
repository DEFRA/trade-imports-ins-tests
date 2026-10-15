import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';

export type AddressTypeOption = 'Origin or Consignor' | 'Destination, Consignee or Importer' | 'Branch';

export class InsAddressBookAddressTypePage extends BasePage {
  readonly expectedUrl = '/address-book/add/address-type';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Choose an address type' });
  }

  get caption(): Locator {
    return this.page.getByText('Add a new address', { exact: true });
  }

  get radioGroup(): Locator {
    return this.page.getByRole('group', { name: 'Choose an address type' });
  }

  get options(): Locator {
    return this.radioGroup.getByRole('radio');
  }

  option(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }

  /** The error summary's link to a field, matched on the whole message. */
  errorSummaryLink(message: string): Locator {
    return this.page.getByRole('alert').getByRole('link', { name: message, exact: true });
  }

  async open(attemptSignIn: boolean = true, options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    await this.page.goto(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn, options);
  }

  async choose(type: AddressTypeOption): Promise<void> {
    await this.option(type).check();
    await this.btnContinue.click();
  }
}

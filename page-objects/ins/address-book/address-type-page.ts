import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';
import { opensAtExpectedUrl } from '@page-objects/shared/opens-at-expected-url';
import type { AddressType } from '@domain/shared/constants/address-types';
import { addressTypeLabels } from '@domain/ins/constants/address-book-types';

export class InsAddressBookAddressTypePage extends opensAtExpectedUrl(BasePage) {
  readonly expectedUrl = '/address-book/add/address-type';

  get caption(): Locator {
    return this.page.getByText('Add a new address', { exact: true });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Choose an address type' });
  }

  get radioGroup(): Locator {
    return this.page.getByRole('group', { name: 'Choose an address type' });
  }

  get radios(): Locator {
    return this.radioGroup.getByRole('radio');
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue', exact: true });
  }

  radio(addressType: AddressType): Locator {
    return this.radioGroup.getByRole('radio', { name: addressTypeLabels[addressType], exact: true });
  }

  async choose(addressType: AddressType): Promise<void> {
    await this.radio(addressType).check();
  }

  async continue(): Promise<void> {
    await this.btnContinue.click();
  }
}

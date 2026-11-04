import { expect, Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';
import { opensAtExpectedUrl } from '@page-objects/ins/address-book/opens-at-expected-url';
import type { AddressType } from '@domain/shared/constants/address-types';
import { addressTypeLabels, addressTypeOptions } from '@domain/ins/constants/address-book-types';

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

  get radioLabels(): Locator {
    return this.radioGroup.locator('.govuk-radios__label');
  }

  get radioHints(): Locator {
    return this.radioGroup.locator('.govuk-radios__hint');
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue', exact: true });
  }

  get inlineError(): Locator {
    return this.radioGroup.locator('.govuk-error-message');
  }

  radio(addressType: AddressType): Locator {
    return this.radioGroup.getByRole('radio', { name: addressTypeLabels[addressType], exact: true });
  }

  async expectNoTypeChosen(): Promise<void> {
    for (const { addressType } of addressTypeOptions) {
      await expect(this.radio(addressType)).not.toBeChecked();
    }
  }

  async choose(addressType: AddressType): Promise<void> {
    await this.radio(addressType).check();
  }

  async continue(): Promise<void> {
    await this.btnContinue.click();
  }
}

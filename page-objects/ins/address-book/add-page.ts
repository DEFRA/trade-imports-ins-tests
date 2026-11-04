import { expect, Locator } from '@playwright/test';
import { type AddressDetails, InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';
import { opensAtExpectedUrl } from '@page-objects/ins/address-book/opens-at-expected-url';
import type { AddressUse } from '@domain/shared/constants/address-types';
import { usesQuestionLabels } from '@domain/ins/constants/address-book-types';

export type NewAddressDetails = AddressDetails;

export class InsAddressBookAddPage extends opensAtExpectedUrl(InsAddressBookFormPage) {
  readonly expectedUrl = '/address-book/add';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add address and contact details' });
  }

  get caption(): Locator {
    return this.page.getByText('Add new address', { exact: true });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get linkCancelAndReturnToAddressBook(): Locator {
    return this.page.getByRole('link', { name: 'Cancel and return to address book', exact: true });
  }

  get btnCancelAndReturnToAddressBook(): Locator {
    return this.page.getByRole('button', { name: 'Cancel and return to address book' });
  }

  get btnSaveAndSelect(): Locator {
    return this.page.getByRole('button', { name: 'Save and select', exact: true });
  }

  get btnSaveAndReturnToAddressPage(): Locator {
    return this.page.getByRole('button', { name: 'Save and return to address page', exact: true });
  }

  get linkCancelAndReturnToHub(): Locator {
    return this.page.getByRole('link', { name: 'Cancel and return to hub', exact: true });
  }

  usesGroup(legend: string): Locator {
    return this.page.getByRole('group', { name: legend, exact: true });
  }

  get sectionBreak(): Locator {
    return this.page.getByRole('separator');
  }

  usesOptions(legend: string): Locator {
    return this.usesGroup(legend).getByRole('checkbox');
  }

  usesOption(use: AddressUse): Locator {
    return this.page.getByRole('checkbox', { name: usesQuestionLabels[use], exact: true });
  }

  async expectUsesOptions(legend: string, uses: readonly AddressUse[]): Promise<void> {
    const options = this.usesOptions(legend);
    await expect(options).toHaveCount(uses.length);
    for (const [index, use] of uses.entries()) {
      await expect(options.nth(index)).toHaveAccessibleName(usesQuestionLabels[use]);
    }
  }

  async tickUses(uses: readonly AddressUse[]): Promise<void> {
    for (const use of uses) {
      await this.usesOption(use).check();
    }
  }

  async saveAndContinue(): Promise<void> {
    await this.btnSaveAndContinue.click();
  }
}

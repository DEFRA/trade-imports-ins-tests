import { Locator } from '@playwright/test';
import { type AddressDetails, InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';
import { opensAtExpectedUrl } from '@page-objects/shared/opens-at-expected-url';
import type { AddressRole } from '@domain/shared/constants/address-types';
import { rolesQuestionLabels } from '@domain/ins/constants/address-book-types';

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

  rolesGroup(legend: string): Locator {
    return this.page.getByRole('group', { name: legend, exact: true });
  }

  get sectionBreak(): Locator {
    return this.page.getByRole('separator');
  }

  rolesOptions(legend: string): Locator {
    return this.rolesGroup(legend).getByRole('checkbox');
  }

  rolesOption(role: AddressRole): Locator {
    return this.page.getByRole('checkbox', { name: rolesQuestionLabels[role], exact: true });
  }

  async tickRoles(roles: readonly AddressRole[]): Promise<void> {
    for (const role of roles) {
      await this.rolesOption(role).check();
    }
  }

  async saveAndContinue(): Promise<void> {
    await this.btnSaveAndContinue.click();
  }
}

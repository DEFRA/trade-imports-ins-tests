import { Locator } from '@playwright/test';
import { type AddressDetails, InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';
import { opensAtExpectedUrl } from '@page-objects/ins/address-book/opens-at-expected-url';
import { usesQuestion, usesQuestionLabels, type AddressUse } from '@domain/shared/constants/address-types';

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

  /** The uses question: the group after the section break that follows the contact fields. */
  get usesGroup(): Locator {
    return this.page.locator('hr.govuk-section-break + .govuk-form-group').getByRole('group', { name: usesQuestion.legend });
  }

  get sectionBreak(): Locator {
    return this.page.getByRole('separator');
  }

  get usesOptionLabels(): Locator {
    return this.usesGroup.locator('label');
  }

  get usesOptionHints(): Locator {
    return this.usesGroup.locator('.govuk-checkboxes__hint');
  }

  get usesInlineError(): Locator {
    return this.usesGroup.locator('.govuk-error-message');
  }

  usesOption(use: AddressUse): Locator {
    return this.usesGroup.getByRole('checkbox', { name: usesQuestionLabels[use], exact: true });
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

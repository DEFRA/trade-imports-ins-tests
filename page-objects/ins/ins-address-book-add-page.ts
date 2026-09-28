import { Locator } from '@playwright/test';
import { type AddressDetails, InsAddressBookFormPage } from '@page-objects/ins/ins-address-book-form-page';

export type NewAddressDetails = AddressDetails;

export class InsAddressBookAddPage extends InsAddressBookFormPage {
  readonly expectedUrl = '/address-book/add';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add address details' });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel and return to address book' });
  }

  get btnCancelFromJourney(): Locator {
    return this.page.getByRole('button', { name: 'Cancel and return to address page' });
  }

  async open(attemptSignIn: boolean = true, options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    await this.page.goto(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn, options);
  }

  /** Complete OIDC when a cross-app link lands on INS without an existing session. */
  async ensureSignedIn(options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    await this.signInWhenRequested(true, options);
  }

  async save(): Promise<void> {
    await this.btnSaveAndContinue.click();
  }
}

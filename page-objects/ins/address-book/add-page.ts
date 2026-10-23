import { Locator } from '@playwright/test';
import { type OpenOptions, type SignInIdentity } from '@page-objects/shared/base-page';
import { type AddressDetails, InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';

export type NewAddressDetails = AddressDetails;

export class InsAddressBookAddPage extends InsAddressBookFormPage {
  readonly expectedUrl = '/address-book/add';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add address details' });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get linkCancel(): Locator {
    return this.page.getByRole('link', { name: 'Cancel and return to address book', exact: true });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel and return to address book' });
  }

  get btnCancelFromJourney(): Locator {
    return this.page.getByRole('button', { name: 'Cancel and return to address page' });
  }

  async open({ attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
    await this.page.goto(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn, identity);
  }

  /** Complete OIDC when a cross-app link lands on INS without an existing session. */
  async ensureSignedIn(options?: SignInIdentity): Promise<void> {
    await this.signInWhenRequested(true, options);
  }

  async save(): Promise<void> {
    await this.btnSaveAndContinue.click();
  }
}

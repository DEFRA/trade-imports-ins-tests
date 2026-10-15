import { Locator } from '@playwright/test';
import { InsAddressBookAddressTypePage } from '@page-objects/ins/address-book/address-type-page';
import { type AddressDetails, InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';

export type NewAddressDetails = AddressDetails;

export class InsAddressBookAddPage extends InsAddressBookFormPage {
  readonly expectedUrl = '/address-book/add';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add address and contact details' });
  }

  get caption(): Locator {
    return this.page.getByText('Add new address', { exact: true });
  }

  /** The notification status banner the journey views render above their content. */
  get journeyStrip(): Locator {
    return this.page.locator('.app-journey-strip');
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

  /** Opens the form the way a trader does: through Choose an address type. */
  async open(attemptSignIn: boolean = true, options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    const typePage = new InsAddressBookAddressTypePage(this.page);
    await typePage.open(attemptSignIn, options);
    if (!attemptSignIn) return;
    await typePage.choose('Origin or Consignor');
  }

  /** Complete OIDC when a cross-app link lands on INS without an existing session. */
  async ensureSignedIn(options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    await this.signInWhenRequested(true, options);
  }

  async save(): Promise<void> {
    await this.btnSaveAndContinue.click();
  }
}

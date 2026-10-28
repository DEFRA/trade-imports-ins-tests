import { Locator } from '@playwright/test';
import { type OpenOptions } from '@page-objects/shared/base-page';
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

  get journeyStrip(): Locator {
    return this.page.getByRole('main').locator('.app-journey-strip');
  }

  get statusTag(): Locator {
    return this.journeyStrip.locator('.govuk-tag');
  }

  get notificationReference(): Locator {
    return this.journeyStrip.locator('.govuk-body');
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

  async save(): Promise<void> {
    await this.btnSaveAndContinue.click();
  }
}

import { Locator } from '@playwright/test';
import { AddressBookSharedFormFields } from '@page-objects/ins/address-book/shared-form-fields';
import { transporterCancelLabel, transporterTypeQuestion } from '@domain/ins/constants/transporter-types';

export interface TransporterSharedDetails {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  email: string;
  phone: string;
}

/** The fields and controls the private and commercial transporter forms share. Each form's own
 * page object adds the fields that differ: the private form's own country select, and the
 * commercial form's approval number and fixed country. */
export abstract class InsTransporterFormPage extends AddressBookSharedFormFields {
  get caption(): Locator {
    return this.page.getByText(transporterTypeQuestion.caption, { exact: true });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get cancelAndReturnToAddressBook(): Locator {
    return this.page.getByRole('button', { name: transporterCancelLabel, exact: true });
  }

  async fillSharedFields(details: TransporterSharedDetails): Promise<void> {
    await this.inputName.fill(details.name);
    await this.inputAddressLine1.fill(details.addressLine1);
    await this.inputAddressLine2.fill(details.addressLine2 ?? '');
    await this.inputTownOrCity.fill(details.townOrCity);
    await this.inputCounty.fill(details.county ?? '');
    await this.inputPostcode.fill(details.postcode);
    await this.inputEmail.fill(details.email);
    await this.inputPhone.fill(details.phone);
  }

  async saveAndContinue(): Promise<void> {
    await this.btnSaveAndContinue.click();
  }
}

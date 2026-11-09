import { Locator } from '@playwright/test';
import { AddressBookSharedFormFields } from '@page-objects/ins/address-book/shared-form-fields';

export type AddressDetails = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
};

export abstract class InsAddressBookFormPage extends AddressBookSharedFormFields {
  get formLabels(): Locator {
    return this.page.getByRole('main').locator('form label');
  }

  async fill(details: AddressDetails): Promise<void> {
    await this.inputName.fill(details.name);
    await this.inputAddressLine1.fill(details.addressLine1);
    await this.inputAddressLine2.fill(details.addressLine2 ?? '');
    await this.inputTownOrCity.fill(details.townOrCity);
    await this.inputCounty.fill(details.county ?? '');
    await this.inputPostcode.fill(details.postcode);
    await this.selectCountry.selectOption(details.country);
    await this.inputEmail.fill(details.email);
    await this.inputPhone.fill(details.phone);
  }
}

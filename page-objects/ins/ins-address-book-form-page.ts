import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

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

/**
 * The Standard Address Block form, shared by add and edit — both render the
 * same fields against the same schema, so only the URL, the heading and the
 * submit button differ. Optional fields are filled with the empty string when
 * omitted so that editing can clear a value that is already stored.
 */
export abstract class InsAddressBookFormPage extends BasePage {
  get inputName(): Locator {
    return this.page.getByLabel('Name or organisation name');
  }

  get inputAddressLine1(): Locator {
    return this.page.getByLabel('Address line 1');
  }

  get inputAddressLine2(): Locator {
    return this.page.getByLabel('Address line 2 (optional)');
  }

  get inputTownOrCity(): Locator {
    return this.page.getByLabel('Town or city');
  }

  get inputCounty(): Locator {
    return this.page.getByLabel('County (optional)');
  }

  get inputPostcode(): Locator {
    return this.page.getByLabel('Postcode or Zip code');
  }

  get selectCountry(): Locator {
    return this.page.getByLabel('Country');
  }

  get inputEmail(): Locator {
    return this.page.getByLabel('Email address');
  }

  get inputPhone(): Locator {
    return this.page.getByLabel('Phone number');
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
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

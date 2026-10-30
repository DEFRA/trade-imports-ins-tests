import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';

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

export const FIELD_LABELS_IN_ORDER = [
  'Name or organisation',
  'Address line 1',
  'Address line 2 (optional)',
  'Town or city',
  'County (optional)',
  'Postcode or Zip code',
  'Country',
  'Email address',
  'Phone number',
];

export abstract class InsAddressBookFormPage extends BasePage {
  get inputName(): Locator {
    return this.page.getByLabel('Name or organisation', { exact: true });
  }

  sectionHeading(name: 'Address' | 'Contact details'): Locator {
    return this.page.getByRole('heading', { level: 2, name, exact: true });
  }

  /** The form's text inputs in page order. */
  get textboxes(): Locator {
    return this.page.getByRole('main').getByRole('textbox');
  }

  /** The label of every field on the form, in page order. */
  get fieldLabels(): Locator {
    return this.page.getByRole('main').locator('form label');
  }

  get countryOptions(): Locator {
    return this.selectCountry.getByRole('option');
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

  get selectedCountryOption(): Locator {
    return this.selectCountry.locator('option:checked');
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

  /** The error summary's link to a field, matched on the whole message. */
  errorSummaryLink(message: string): Locator {
    return this.page.getByRole('alert').getByRole('link', { name: message, exact: true });
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

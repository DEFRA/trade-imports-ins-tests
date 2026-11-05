import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';
import { ADDRESS_FORM_FIELD_LABELS } from '@domain/ins/constants/address-form';

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

export abstract class InsAddressBookFormPage extends BasePage {
  get inputName(): Locator {
    return this.page.getByLabel(ADDRESS_FORM_FIELD_LABELS.name, { exact: true });
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
    return this.page.getByLabel(ADDRESS_FORM_FIELD_LABELS.addressLine1);
  }

  get inputAddressLine2(): Locator {
    return this.page.getByLabel(ADDRESS_FORM_FIELD_LABELS.addressLine2);
  }

  get inputTownOrCity(): Locator {
    return this.page.getByLabel(ADDRESS_FORM_FIELD_LABELS.townOrCity);
  }

  get inputCounty(): Locator {
    return this.page.getByLabel(ADDRESS_FORM_FIELD_LABELS.county);
  }

  get inputPostcode(): Locator {
    return this.page.getByLabel(ADDRESS_FORM_FIELD_LABELS.postcode);
  }

  get selectCountry(): Locator {
    return this.page.getByLabel(ADDRESS_FORM_FIELD_LABELS.country);
  }

  get selectedCountryOption(): Locator {
    return this.selectCountry.locator('option:checked');
  }

  get inputEmail(): Locator {
    return this.page.getByLabel(ADDRESS_FORM_FIELD_LABELS.email);
  }

  get inputPhone(): Locator {
    return this.page.getByLabel(ADDRESS_FORM_FIELD_LABELS.phone);
  }

  /** The error summary's link to a field, matched on the whole message. */
  errorSummaryLink(message: string): Locator {
    return this.errorSummary.getByRole('link', { name: message, exact: true });
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

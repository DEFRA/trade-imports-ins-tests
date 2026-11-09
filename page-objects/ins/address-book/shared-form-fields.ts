import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';
import { ADDRESS_FORM_FIELD_LABELS } from '@domain/ins/constants/address-form';

/** The Standard Address Block and contact fields the address and transporter forms share. */
export abstract class AddressBookSharedFormFields extends BasePage {
  sectionHeading(name: 'Address' | 'Contact details'): Locator {
    return this.page.getByRole('heading', { level: 2, name, exact: true });
  }

  get textboxes(): Locator {
    return this.page.getByRole('main').getByRole('textbox');
  }

  get inputName(): Locator {
    return this.page.getByLabel(ADDRESS_FORM_FIELD_LABELS.name, { exact: true });
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

  get countryOptions(): Locator {
    return this.selectCountry.getByRole('option');
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
}

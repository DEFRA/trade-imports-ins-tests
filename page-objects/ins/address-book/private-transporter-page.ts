import { Locator } from '@playwright/test';
import { InsTransporterFormPage } from '@page-objects/ins/address-book/transporter-form-page';
import { opensAtExpectedUrl } from '@page-objects/shared/opens-at-expected-url';
import { TRANSPORTER_FORM_FIELD_LABELS } from '@domain/ins/constants/transporter-form';

export interface PrivateTransporterDetails {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export class InsPrivateTransporterPage extends opensAtExpectedUrl(InsTransporterFormPage) {
  readonly expectedUrl = '/address-book/add/transporter/private';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add a private transporter' });
  }

  get selectCountry(): Locator {
    return this.page.getByLabel(TRANSPORTER_FORM_FIELD_LABELS.country);
  }

  get countryOptions(): Locator {
    return this.selectCountry.getByRole('option');
  }

  get selectedCountryOption(): Locator {
    return this.selectCountry.locator('option:checked');
  }

  async fill(details: PrivateTransporterDetails): Promise<void> {
    await this.fillSharedFields(details);
    await this.selectCountry.selectOption(details.country);
  }
}

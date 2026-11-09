import { Locator } from '@playwright/test';
import { InsTransporterFormPage, type TransporterSharedDetails } from '@page-objects/ins/address-book/transporter-form-page';
import { opensAtExpectedUrl } from '@page-objects/shared/opens-at-expected-url';

export interface PrivateTransporterDetails extends TransporterSharedDetails {
  country: string;
}

export class InsPrivateTransporterPage extends opensAtExpectedUrl(InsTransporterFormPage) {
  readonly expectedUrl = '/address-book/add/transporter/private';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add a private transporter' });
  }

  async fill(details: PrivateTransporterDetails): Promise<void> {
    await this.fillSharedFields(details);
    await this.selectCountry.selectOption(details.country);
  }
}

import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export type PrivateTransporterDetails = {
  name: string;
  addressLine1: string;
  townOrCity: string;
  postalOrZipCode: string;
  country: string;
  telephoneNumber: string;
  emailAddress: string;
};

/** Keyed-in transporter details, owed only when the transporter type is Private. */
export class PrivateTransporterPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters/add/private');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add private transporter' });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  async fill(details: PrivateTransporterDetails): Promise<void> {
    await this.page.getByLabel('Name or organisation name').fill(details.name);
    await this.page.getByLabel('Address line 1').fill(details.addressLine1);
    await this.page.getByLabel('Town or city').fill(details.townOrCity);
    await this.page.getByLabel('Postcode or Zip code').fill(details.postalOrZipCode);
    await this.page.getByLabel('Country').selectOption(details.country);
    await this.page.getByLabel('Phone number').fill(details.telephoneNumber);
    await this.page.getByLabel('Email address').fill(details.emailAddress);
  }
}

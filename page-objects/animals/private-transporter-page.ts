import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export type PrivateTransporterDetails = {
  name: string;
  addressLine1: string;
  townOrCity: string;
  postalOrZipCode: string;
  country: string;
  telephoneNumber: string;
  emailAddress: string;
};

export class AnimalsPrivateTransporterPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters/add/private');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add private transporter' });
  }

  get name(): Locator {
    return this.page.getByLabel('Name or organisation name');
  }

  get addressLine1(): Locator {
    return this.page.getByLabel('Address line 1');
  }

  get townOrCity(): Locator {
    return this.page.getByLabel('Town or city');
  }

  get postcode(): Locator {
    return this.page.getByLabel('Postcode or Zip code');
  }

  get country(): Locator {
    return this.page.getByLabel('Country');
  }

  get phone(): Locator {
    return this.page.getByLabel('Phone number');
  }

  get email(): Locator {
    return this.page.getByLabel('Email address');
  }

  async fill(details: PrivateTransporterDetails): Promise<void> {
    await this.name.fill(details.name);
    await this.addressLine1.fill(details.addressLine1);
    await this.townOrCity.fill(details.townOrCity);
    await this.postcode.fill(details.postalOrZipCode);
    await this.country.selectOption(details.country);
    await this.phone.fill(details.telephoneNumber);
    await this.email.fill(details.emailAddress);
  }
}

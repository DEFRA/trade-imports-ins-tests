import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export type CommercialTransporterDetails = {
  approvalNumber: string;
  name: string;
  addressLine1: string;
  townOrCity: string;
  postalOrZipCode: string;
  emailAddress: string;
  telephoneNumber: string;
};

/**
 * The commercial arm of the add route — the form a trader fills in for a
 * commercial transporter that is not on the list, giving its authorisation
 * number, name, address and contact details.
 */
export class AnimalsCommercialTransporterPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters/add/commercial');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add a commercial transporter' });
  }

  get approvalNumber(): Locator {
    return this.page.getByLabel('Transporter authorisation number');
  }

  get nameOrOrganisationName(): Locator {
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

  get email(): Locator {
    return this.page.getByLabel('Email address');
  }

  get phone(): Locator {
    return this.page.getByLabel('Phone number');
  }

  async fill(details: CommercialTransporterDetails): Promise<void> {
    await this.approvalNumber.fill(details.approvalNumber);
    await this.nameOrOrganisationName.fill(details.name);
    await this.addressLine1.fill(details.addressLine1);
    await this.townOrCity.fill(details.townOrCity);
    await this.postcode.fill(details.postalOrZipCode);
    await this.email.fill(details.emailAddress);
    await this.phone.fill(details.telephoneNumber);
  }
}

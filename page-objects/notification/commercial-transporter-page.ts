import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

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
 * number, name, address and contact details. The country is fixed to Northern
 * Ireland rather than asked, so there is nothing to fill in for it.
 */
export class CommercialTransporterPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters/add/commercial');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add commercial transporter' });
  }

  get approvalNumber(): Locator {
    return this.page.getByLabel('Transporter authorisation number');
  }

  get nameOrOrganisationName(): Locator {
    return this.page.getByLabel('Name or organisation name');
  }

  /** Shown and fixed, never asked — a disabled select carrying Northern Ireland. */
  get country(): Locator {
    return this.page.getByLabel('Country');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  async fill(details: CommercialTransporterDetails): Promise<void> {
    await this.approvalNumber.fill(details.approvalNumber);
    await this.nameOrOrganisationName.fill(details.name);
    await this.page.getByLabel('Address line 1').fill(details.addressLine1);
    await this.page.getByLabel('Town or city').fill(details.townOrCity);
    await this.page.getByLabel('Postcode or zip code').fill(details.postalOrZipCode);
    await this.page.getByLabel('Email address').fill(details.emailAddress);
    await this.page.getByLabel('Phone number').fill(details.telephoneNumber);
  }
}

import { type Locator, type Page } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';

/** The details of an address copied onto the notification, as the edit form names its fields. */
export type PlantsPartyEditFields = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  townOrCity: string;
  county: string;
  postcode: string;
  phone: string;
  email: string;
};

/**
 * Edits the copy of an address held on one notification — never the address
 * book record it was picked from. One page per role, all with the same form.
 */
export class PlantsPartyEditPage extends PlantsNotificationPage {
  constructor(
    page: Page,
    slug: string,
    readonly caption: string,
  ) {
    super(page, slug);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Edit address details' });
  }

  get roleCaption(): Locator {
    return this.page.getByText(this.caption, { exact: true });
  }

  get name(): Locator {
    return this.page.getByLabel('Name or organisation name', { exact: true });
  }

  get addressLine1(): Locator {
    return this.page.getByLabel('Address line 1', { exact: true });
  }

  get addressLine2(): Locator {
    return this.page.getByLabel('Address line 2 (optional)', { exact: true });
  }

  get townOrCity(): Locator {
    return this.page.getByLabel('Town or city', { exact: true });
  }

  get county(): Locator {
    return this.page.getByLabel('County (optional)', { exact: true });
  }

  get postcode(): Locator {
    return this.page.getByLabel('Postcode or Zip code', { exact: true });
  }

  get country(): Locator {
    return this.page.getByLabel('Country', { exact: true });
  }

  get phone(): Locator {
    return this.page.getByLabel('Phone number', { exact: true });
  }

  get email(): Locator {
    return this.page.getByLabel('Email address', { exact: true });
  }

  get saveChanges(): Locator {
    return this.page.getByRole('button', { name: 'Save changes' });
  }

  get cancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) });
  }

  /** The error message govukInput/govukSelect renders inside the field's own form group. */
  fieldError(field: Locator): Locator {
    return this.page.locator('.govuk-form-group--error', { has: field }).locator('.govuk-error-message');
  }

  async fill(fields: Partial<PlantsPartyEditFields>): Promise<void> {
    for (const [key, value] of Object.entries(fields) as Array<[keyof PlantsPartyEditFields, string]>) {
      await this[key].fill(value);
    }
  }
}

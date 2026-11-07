import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';
import { TRANSPORTER_FORM_FIELD_LABELS } from '@domain/ins/constants/transporter-form';
import { transporterCancelLabel } from '@domain/ins/constants/transporter-types';

/** The fields and controls the private and commercial transporter forms share. Each form's own
 * page object adds the fields that differ: the private form's own country select, and the
 * commercial form's approval number and fixed country. */
export abstract class InsTransporterFormPage extends BasePage {
  get caption(): Locator {
    return this.page.getByText('Add a new transporter', { exact: true });
  }

  sectionHeading(name: 'Address' | 'Contact details'): Locator {
    return this.page.getByRole('heading', { level: 2, name, exact: true });
  }

  get textboxes(): Locator {
    return this.page.getByRole('main').getByRole('textbox');
  }

  get inputName(): Locator {
    return this.page.getByLabel(TRANSPORTER_FORM_FIELD_LABELS.name, { exact: true });
  }

  get inputAddressLine1(): Locator {
    return this.page.getByLabel(TRANSPORTER_FORM_FIELD_LABELS.addressLine1);
  }

  get inputAddressLine2(): Locator {
    return this.page.getByLabel(TRANSPORTER_FORM_FIELD_LABELS.addressLine2);
  }

  get inputTownOrCity(): Locator {
    return this.page.getByLabel(TRANSPORTER_FORM_FIELD_LABELS.townOrCity);
  }

  get inputCounty(): Locator {
    return this.page.getByLabel(TRANSPORTER_FORM_FIELD_LABELS.county);
  }

  get inputPostcode(): Locator {
    return this.page.getByLabel(TRANSPORTER_FORM_FIELD_LABELS.postcode);
  }

  get inputEmail(): Locator {
    return this.page.getByLabel(TRANSPORTER_FORM_FIELD_LABELS.email);
  }

  get inputPhone(): Locator {
    return this.page.getByLabel(TRANSPORTER_FORM_FIELD_LABELS.phone);
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get linkCancelAndReturnToAddressBook(): Locator {
    return this.page.getByRole('link', { name: transporterCancelLabel, exact: true });
  }

  async fillSharedFields({
    name,
    addressLine1,
    addressLine2,
    townOrCity,
    county,
    postcode,
    email,
    phone,
  }: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    townOrCity: string;
    county?: string;
    postcode: string;
    email: string;
    phone: string;
  }): Promise<void> {
    await this.inputName.fill(name);
    await this.inputAddressLine1.fill(addressLine1);
    await this.inputAddressLine2.fill(addressLine2 ?? '');
    await this.inputTownOrCity.fill(townOrCity);
    await this.inputCounty.fill(county ?? '');
    await this.inputPostcode.fill(postcode);
    await this.inputEmail.fill(email);
    await this.inputPhone.fill(phone);
  }

  async saveAndContinue(): Promise<void> {
    await this.btnSaveAndContinue.click();
  }
}

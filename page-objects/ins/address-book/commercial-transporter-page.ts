import { Locator } from '@playwright/test';
import { InsTransporterFormPage } from '@page-objects/ins/address-book/transporter-form-page';
import { opensAtExpectedUrl } from '@page-objects/shared/opens-at-expected-url';
import { TRANSPORTER_FORM_FIELD_LABELS } from '@domain/ins/constants/transporter-form';

export interface CommercialTransporterDetails {
  name: string;
  approvalNumber: string;
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  email: string;
  phone: string;
}

export class InsCommercialTransporterPage extends opensAtExpectedUrl(InsTransporterFormPage) {
  readonly expectedUrl = '/address-book/add/transporter/commercial';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add a commercial transporter' });
  }

  get inputApprovalNumber(): Locator {
    return this.page.getByLabel(TRANSPORTER_FORM_FIELD_LABELS.approvalNumber, { exact: true });
  }

  /** The country select is disabled and fixed: this reads the Northern Ireland label it shows. */
  get countryDisplay(): Locator {
    return this.page.getByLabel('Country', { exact: true });
  }

  async fill({ approvalNumber, ...sharedFields }: CommercialTransporterDetails): Promise<void> {
    await this.fillSharedFields(sharedFields);
    await this.inputApprovalNumber.fill(approvalNumber);
  }
}

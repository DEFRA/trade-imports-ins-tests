import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';
import { opensAtExpectedUrl } from '@page-objects/shared/opens-at-expected-url';
import { transporterTypeLabels, type TransporterType } from '@domain/ins/constants/transporter-types';

export class InsTransporterTypePage extends opensAtExpectedUrl(BasePage) {
  readonly expectedUrl = '/address-book/add/transporter';

  get caption(): Locator {
    return this.page.getByText('Add a new transporter', { exact: true });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Choose a transporter type' });
  }

  get warning(): Locator {
    return this.page.getByText('Check the transporter list before adding new transporters to avoid duplicates.', { exact: true });
  }

  get radioGroup(): Locator {
    return this.page.getByRole('group', { name: 'Choose a transporter type' });
  }

  get radios(): Locator {
    return this.radioGroup.getByRole('radio');
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue', exact: true });
  }

  radio(transporterType: TransporterType): Locator {
    return this.radioGroup.getByRole('radio', { name: transporterTypeLabels[transporterType], exact: true });
  }

  async choose(transporterType: TransporterType): Promise<void> {
    await this.radio(transporterType).check();
  }

  async continue(): Promise<void> {
    await this.btnContinue.click();
  }
}

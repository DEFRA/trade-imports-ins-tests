import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { DatePicker } from '@page-objects/shared/date-picker';

export class AnimalsArrivalDetailsPage extends NotificationPage {
  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, 'port-of-entry');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Arrival details' });
  }

  get portOfEntry(): Locator {
    return this.page.getByLabel('Port of entry', { exact: true });
  }

  get portOfEntryValue(): Locator {
    return this.page.locator('select#portOfEntry-select');
  }

  get portOptions(): Locator {
    return this.portOfEntryValue.locator('option:not([value=""])');
  }

  async selectPort(label: string): Promise<void> {
    await this.portOfEntry.click();
    await this.portOfEntry.fill(label);
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  get meansOfTransport(): Locator {
    return this.page.getByLabel('Means of transport to the port of entry', { exact: true });
  }

  get meansOfTransportOptions(): Locator {
    return this.meansOfTransport.locator('option');
  }

  get transportIdentificationLeadIn(): Locator {
    return this.fieldHint('transportIdentification').locator('p');
  }

  get transportIdentificationList(): Locator {
    return this.fieldHint('transportIdentification').locator('ul');
  }

  get transportIdentificationItems(): Locator {
    return this.fieldHint('transportIdentification').locator('li');
  }

  get transportIdentification(): Locator {
    return this.page.getByLabel('Transport identification');
  }

  get transportDocumentReference(): Locator {
    return this.page.getByLabel('Transport document reference');
  }

  get arrivalDate(): Locator {
    return this.page.locator('input[name="arrivalDateAtPort"]');
  }

  get arrivalDateError(): Locator {
    return this.page.locator('#arrivalDateAtPort-error');
  }

  get datePicker(): Locator {
    return this.page.locator('[data-module="moj-date-picker"]');
  }

  get arrivalDatePicker(): DatePicker {
    return new DatePicker(this.page, 'arrivalDateAtPort');
  }

  async fillArrivalDate(date: string): Promise<void> {
    await this.arrivalDate.fill(date);
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }
}

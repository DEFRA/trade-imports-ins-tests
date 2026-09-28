import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class ArrivalDetailsPage extends NotificationPage {
  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, 'port-of-entry');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Arrival details' });
  }

  // Progressive enhancement swaps the native <select> for an
  // accessible-autocomplete combobox that keeps the field's id and label.
  get portOfEntry(): Locator {
    return this.page.getByLabel('Port of entry', { exact: true });
  }

  // The native <select> behind the enhancement — hidden and renamed with a
  // "-select" suffix, it still submits the selected port code.
  get portOfEntryValue(): Locator {
    return this.page.locator('select#portOfEntry-select');
  }

  // Drive the type-ahead the way a user does: type to filter, then pick the
  // matching option by its "{name} ({code})" label.
  async selectPort(label: string): Promise<void> {
    await this.portOfEntry.click();
    await this.portOfEntry.fill(label);
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  // Means of transport is a <select> labelled by its visible question text.
  get meansOfTransport(): Locator {
    return this.page.getByLabel('Means of transport to the port of entry', { exact: true });
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

  async fillArrivalDate(date: string): Promise<void> {
    await this.arrivalDate.fill(date);
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

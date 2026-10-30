import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { DatePicker } from '@page-objects/shared/date-picker';
import { TypeAhead } from '@page-objects/shared/type-ahead';

export class AnimalsArrivalDetailsPage extends NotificationPage {
  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, 'port-of-entry');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Arrival details' });
  }

  get portOfEntry(): TypeAhead {
    return new TypeAhead(this.page, 'portOfEntry');
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

  get arrivalDatePicker(): DatePicker {
    return new DatePicker(this.page, 'arrivalDateAtPort');
  }

  async fillArrivalDate(date: string): Promise<void> {
    await this.arrivalDate.fill(date);
  }
}

import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { pickerSearchBox, pickerSearchButton } from '@page-objects/shared/address-picker-results';

export class AnimalsTransporterPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Transporter details' });
  }

  transporter(name: string): Locator {
    return this.page.getByRole('radio', { name: `Select ${name}`, exact: true });
  }

  get searchBox(): Locator {
    return pickerSearchBox(this.page);
  }

  get searchButton(): Locator {
    return pickerSearchButton(this.page);
  }

  get table(): Locator {
    return this.page.getByRole('table');
  }

  get listedTransporters(): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('radio') });
  }

  get addTransporter(): Locator {
    return this.page.getByRole('button', { name: 'Add a transporter' });
  }
}

import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class TransporterSelectionPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters/select');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', {
      level: 1,
      name: 'Search for an approved commercial transporter',
    });
  }

  transporter(name: string): Locator {
    return this.page.getByRole('radio', { name });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

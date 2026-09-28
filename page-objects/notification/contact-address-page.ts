import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class ContactAddressPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'consignment/contact/select');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Contact address for consignment' });
  }

  address(name: string): Locator {
    return this.page.getByRole('radio', { name });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

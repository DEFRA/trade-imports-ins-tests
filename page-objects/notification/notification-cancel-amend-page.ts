import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class NotificationCancelAmendPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'cancel-amend');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Cancel this amendment?' });
  }

  get confirm(): Locator {
    return this.page.getByRole('button', { name: 'Yes, cancel amendment' });
  }

  get reject(): Locator {
    return this.page.getByRole('button', { name: /No/ });
  }
}

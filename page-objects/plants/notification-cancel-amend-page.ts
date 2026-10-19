import { type Locator, type Page } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';

export class PlantsNotificationCancelAmendPage extends PlantsNotificationPage {
  constructor(page: Page) {
    super(page, 'cancel-amend');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Cancel this amendment?' });
  }

  get confirm(): Locator {
    return this.page.getByRole('button', { name: 'Yes, cancel amendment' });
  }
}

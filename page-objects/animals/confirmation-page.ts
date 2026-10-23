import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsConfirmationPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'confirmation');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Import notification submitted' });
  }

  get outstandingItems(): Locator {
    return this.page.getByRole('heading', { name: 'Before the consignment is imported' }).locator('~ ul').first().getByRole('listitem');
  }

  get viewOrChangeSentence(): Locator {
    return this.page.getByRole('heading', { name: 'How to view or amend this notification' }).locator('~ p').first();
  }

  get contactHmrcLink(): Locator {
    return this.page.getByRole('link', { name: 'contact HMRC (opens in a new tab)', exact: true });
  }

  get callChargesLink(): Locator {
    return this.page.getByRole('link', { name: 'Find out about call charges (opens in a new tab)', exact: true });
  }
}

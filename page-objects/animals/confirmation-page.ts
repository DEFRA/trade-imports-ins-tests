import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsConfirmationPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'confirmation');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Import notification submitted' });
  }

  get outstandingHeading(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Before the consignment is imported' });
  }

  get outstandingDocuments(): Locator {
    return this.page.getByRole('listitem').filter({ hasText: /^upload the ITAHC and any other required documents$/ });
  }

  get viewOrAmendBody(): Locator {
    return this.page.getByText('You can view or change this notification from your dashboard.', { exact: true });
  }

  get contactHmrc(): Locator {
    return this.page.getByRole('link', { name: 'contact HMRC (opens in a new tab)', exact: true });
  }

  get callCharges(): Locator {
    return this.page.getByRole('link', { name: 'Find out about call charges (opens in a new tab)', exact: true });
  }
}

import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

export class PlantsDeleteNotificationPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'delete');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Delete this notification?' });
  }

  get body(): Locator {
    return this.page.getByText('This cannot be undone.');
  }

  get btnConfirm(): Locator {
    return this.page.getByRole('button', { name: 'Yes, delete notification', exact: true });
  }

  /** A govukButton with an href, so it is a link that reports role="button". */
  get btnNo(): Locator {
    return this.page.getByRole('button', { name: 'No, return to dashboard', exact: true });
  }
}

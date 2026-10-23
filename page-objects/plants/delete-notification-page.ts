import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import { deleteNotificationConfirm, deleteNotificationHeading } from '@page-objects/shared/delete-notification';

export class PlantsDeleteNotificationPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'delete');
  }

  get heading(): Locator {
    return deleteNotificationHeading(this.page);
  }

  get body(): Locator {
    return this.page.getByText('This cannot be undone.');
  }

  get btnConfirm(): Locator {
    return deleteNotificationConfirm(this.page);
  }

  /** A govukButton with an href, so it is a link that reports role="button". */
  get btnNo(): Locator {
    return this.page.getByRole('button', { name: 'No, return to dashboard', exact: true });
  }
}

import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import { amendNotificationConfirm, amendNotificationHeading } from '@page-objects/shared/amend-notification';

export class PlantsNotificationAmendPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'amend');
  }

  get heading(): Locator {
    return amendNotificationHeading(this.page);
  }

  get confirmAmend(): Locator {
    return amendNotificationConfirm(this.page);
  }
}

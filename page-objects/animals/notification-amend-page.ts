import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { amendNotificationConfirm, amendNotificationHeading } from '@page-objects/shared/amend-notification';

export class AnimalsNotificationAmendPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'amend');
  }

  get heading(): Locator {
    return amendNotificationHeading(this.page);
  }

  get confirmAmend(): Locator {
    return amendNotificationConfirm(this.page);
  }
}

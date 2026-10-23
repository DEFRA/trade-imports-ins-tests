import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { deleteNotificationConfirm, deleteNotificationHeading } from '@page-objects/shared/delete-notification';

export class AnimalsDeleteNotificationPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'delete');
  }

  get heading(): Locator {
    return deleteNotificationHeading(this.page);
  }

  get btnConfirm(): Locator {
    return deleteNotificationConfirm(this.page);
  }
}

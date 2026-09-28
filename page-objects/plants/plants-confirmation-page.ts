import type { Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

export class PlantsConfirmationPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'confirmation');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Notification submitted', level: 1 });
  }
  get panel(): Locator {
    return this.page.locator('.govuk-panel');
  }
  get notificationDate(): Locator {
    return this.page.getByText(/Date of notification/).first();
  }
  /** Main content region, for assertions that span the caption and its value. */
  get content(): Locator {
    return this.page.getByRole('main');
  }
  get lateBanner(): Locator {
    return this.page.getByRole('heading', { name: 'Your notification was made outside the required timing', exact: true });
  }
  get viewNotification(): Locator {
    return this.page.getByRole('link', { name: 'View your notification', exact: true });
  }
}

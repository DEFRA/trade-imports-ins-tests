import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class OverviewPage extends NotificationPage {
  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, '');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Overview' });
  }

  get journeyStrip(): Locator {
    return this.page.locator('.app-journey-strip');
  }

  /**
   * Design release 1 reaches the review from a primary button under the task
   * list rather than from a task row, and offers it whatever the notification
   * still owes.
   */
  get reviewAndSubmitButton(): Locator {
    return this.page.getByRole('button', { name: 'Review and submit' });
  }

  task(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }
}

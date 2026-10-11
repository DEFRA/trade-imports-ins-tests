import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsOverviewPage extends NotificationPage {
  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, '');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Overview' });
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

  // Every task row's status tag, so a spec can count the rows the overview draws.
  get taskStatuses(): Locator {
    return this.page.locator('.govuk-task-list__status');
  }

  taskStatus(name: string): Locator {
    return this.page
      .locator('.govuk-task-list__item')
      .filter({ has: this.page.getByRole('link', { name, exact: true }) })
      .locator('.govuk-task-list__status');
  }
}

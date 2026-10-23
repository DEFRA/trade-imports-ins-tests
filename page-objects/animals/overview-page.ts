import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsOverviewPage extends NotificationPage {
  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, '');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Overview' });
  }

  get numberedSectionHeadings(): Locator {
    return this.page.getByRole('heading', { level: 3, name: /^\d+\. / });
  }

  get reviewAndSubmitButton(): Locator {
    return this.page.getByRole('button', { name: 'Review and submit' });
  }

  task(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }

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

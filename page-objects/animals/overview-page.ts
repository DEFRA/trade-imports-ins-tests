import type { Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

const TASK_LIST_NAME = 'Notification tasklist';

export class AnimalsOverviewPage extends NotificationPage {
  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, '');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Overview' });
  }

  get taskListHeading(): Locator {
    return this.page.getByRole('heading', { level: 2, name: TASK_LIST_NAME });
  }

  get taskListRegion(): Locator {
    return this.region(TASK_LIST_NAME);
  }

  get commodityTotalsRegion(): Locator {
    return this.region('Your commodities');
  }

  get sectionRegions(): Locator {
    return this.taskListRegion.getByRole('region');
  }

  get numberedSectionHeadings(): Locator {
    return this.page.getByRole('heading', { level: 3, name: /^\d+\. / });
  }

  get reviewAndSubmitButton(): Locator {
    return this.page.getByRole('button', { name: 'Review and submit' });
  }

  get buttons(): Locator {
    return this.page.getByRole('main').getByRole('button');
  }

  task(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }

  taskTitlesInSectionHeaded(heading: string): Locator {
    return this.region(heading).getByRole('link');
  }

  get taskNames(): Locator {
    return this.page.locator('.govuk-task-list__link');
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

  async taskStatusAfterReopening(referenceNumber: string, name: string): Promise<Locator> {
    await this.open(referenceNumber);
    return this.taskStatus(name);
  }

  async openTaskAfterReopening(referenceNumber: string, name: string): Promise<void> {
    await this.open(referenceNumber);
    await this.task(name).click();
  }
}

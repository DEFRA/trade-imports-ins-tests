import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';

export class PlantsOverviewPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, '');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Overview' });
  }

  get btnReturnToDashboard(): Locator {
    return this.page.getByRole('button', { name: 'Return to dashboard', exact: true });
  }

  get taskLists(): Locator {
    return this.page.locator('.govuk-task-list');
  }

  get groupHeadings(): Locator {
    return this.page.getByRole('heading', { level: 2, name: /^[1-4]\. / });
  }

  taskRowLink(title: string): Locator {
    return this.page.getByRole('link', { name: title, exact: true });
  }

  get reviewTaskLink(): Locator {
    return this.taskRowLink('Check and submit');
  }

  taskRow(title: string): Locator {
    return this.page.getByRole('listitem').filter({ has: this.taskRowLink(title) });
  }

  taskRowByTitle(title: string): Locator {
    return this.page.locator('.govuk-task-list__item').filter({ hasText: title });
  }
}

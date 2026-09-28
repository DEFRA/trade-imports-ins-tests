import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

export class PlantsOverviewPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, '');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Overview' });
  }

  get journeyStrip(): Locator {
    return this.page.locator('.app-journey-strip');
  }

  get statusTag(): Locator {
    return this.journeyStrip.locator('.govuk-tag');
  }

  get reference(): Locator {
    return this.journeyStrip.locator('span.govuk-body');
  }

  /** A govukButton with an href, which govuk-frontend renders with role="button". */
  get btnReturnToDashboard(): Locator {
    return this.page.getByRole('button', { name: 'Return to dashboard', exact: true });
  }

  get taskLists(): Locator {
    return this.page.locator('.govuk-task-list');
  }

  /**
   * The hub's numbered group captions ("1. About the consignment" and its three
   * siblings). A group with no task rows is not rendered, caption and all.
   */
  get groupHeadings(): Locator {
    return this.page.getByRole('heading', { level: 2, name: /^[1-4]\. / });
  }

  /** A row is addressed through its link, which is the only text govukTaskList
   * gives it when the row carries no hint. */
  taskRowLink(title: string): Locator {
    return this.page.getByRole('link', { name: title, exact: true });
  }

  taskRow(title: string): Locator {
    return this.page.getByRole('listitem').filter({ has: this.taskRowLink(title) });
  }

  /**
   * A row addressed by its title text rather than by its link. A blocked row
   * carries no link at all, so it is only reachable this way.
   */
  taskRowByTitle(title: string): Locator {
    return this.page.locator('.govuk-task-list__item').filter({ hasText: title });
  }
}

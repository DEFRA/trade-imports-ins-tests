import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsOverviewPage extends NotificationPage {
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

  /** The tag in the status strip: the draft status on a notification, Template in template mode. */
  get statusTag(): Locator {
    return this.journeyStrip.locator('.govuk-tag');
  }

  taskListHeading(name: string): Locator {
    return this.page.getByRole('heading', { level: 2, name, exact: true });
  }

  /** The commodity-total labels are h3s too, so the section headings are read off their own class. */
  get sectionHeadings(): Locator {
    return this.page.locator('h3.govuk-heading-m');
  }

  get taskLists(): Locator {
    return this.page.locator('ul.app-task-list');
  }

  get actionButtons(): Locator {
    return this.page.locator('.govuk-button-group .govuk-button');
  }

  get btnReviewTemplate(): Locator {
    return this.page.getByRole('button', { name: 'Review template', exact: true });
  }

  get btnReturnToManageTemplates(): Locator {
    return this.page.getByRole('button', { name: 'Return to manage templates', exact: true });
  }

  /** A link styled as a button, so it carries the button role. */
  get btnReturnToDashboard(): Locator {
    return this.page.getByRole('button', { name: 'Return to dashboard', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  get btnSaveTemplate(): Locator {
    return this.page.getByRole('button', { name: 'Save template', exact: true });
  }

  get commodityTotalValues(): Locator {
    return this.page.locator('.app-commodity-total__value');
  }

  /** The status tag beside a task, found through the list item holding the task's link. */
  taskStatus(name: string): Locator {
    return this.page
      .getByRole('listitem')
      .filter({ has: this.task(name) })
      .locator('.govuk-task-list__status');
  }

  /** Every link in the page body whose address contains the fragment. */
  linksTo(fragment: string): Locator {
    return this.page.locator(`main a[href*="${fragment}"]`);
  }
}

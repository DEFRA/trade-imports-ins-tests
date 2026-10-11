import type { Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';

export class PlantsNotificationViewPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'notification-view');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Check your answers', level: 1 });
  }
  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue', exact: true });
  }
  /** On the review, Cancel amend is the button beside Continue, not the status bar link. */
  override get cancelAmend(): Locator {
    return this.page.getByRole('button', { name: 'Cancel amend', exact: true });
  }
  get statusBarCancelAmend(): Locator {
    return this.journeyStrip.getByRole('link', { name: 'Cancel amend', exact: true });
  }
  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete notification', exact: true });
  }
  get changeLinks(): Locator {
    return this.page.getByRole('link', { name: /^Change/ });
  }
  get lateBanner(): Locator {
    return this.page.getByRole('heading', { name: 'Your notification was made outside the required timing', exact: true });
  }
  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }
  card(title: string): Locator {
    return this.page.locator('.govuk-summary-card').filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }
  rowValue(title: string, key: string): Locator {
    return this.card(title)
      .locator('.govuk-summary-list__row', { has: this.page.getByRole('term').and(this.page.getByText(key, { exact: true })) })
      .locator('.govuk-summary-list__value');
  }
  change(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }
}

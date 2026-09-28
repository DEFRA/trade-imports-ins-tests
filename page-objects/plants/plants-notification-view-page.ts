import type { Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

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
  change(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }
}

import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';

export class PlantsArrivalStatusPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'arrival-status');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', {
      level: 1,
      name: 'Has the consignment arrived in Great Britain?',
    });
  }

  arrivalStatus(label: string): Locator {
    return this.page.getByRole('radio', { name: label, exact: true });
  }

  arrivalStatusHint(label: string): Locator {
    return this.page.locator('.govuk-radios__item').filter({ hasText: label }).locator('.govuk-hint');
  }
}

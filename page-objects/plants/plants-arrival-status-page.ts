import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

/**
 * Whether the consignment has already arrived in Great Britain — the arrival
 * section's opening question, and the answer the rest of that section turns on.
 *
 * Only plants for planting and wood and cut trees are asked it. A potato
 * notification never reaches the page: `arrivalStatus` is out of scope for
 * potatoes, so the opening run skips the step and the hub's arrival row stays
 * blocked.
 */
export class PlantsArrivalStatusPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'arrival-status');
  }

  /** The radios' legend is the page heading, so the h1 sits inside the fieldset. */
  get heading(): Locator {
    return this.page.getByRole('heading', {
      level: 1,
      name: 'Has the consignment arrived in Great Britain?',
    });
  }

  arrivalStatus(label: string): Locator {
    return this.page.getByRole('radio', { name: label, exact: true });
  }

  /**
   * The hint under one radio. It is tied to the input by aria-describedby, which
   * no locator addresses, so it is reached through the radio item that holds
   * both — which is what proves the hint is on the option it describes.
   */
  arrivalStatusHint(label: string): Locator {
    return this.page.locator('.govuk-radios__item').filter({ hasText: label }).locator('.govuk-hint');
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  get btnSaveAndReturnToOverview(): Locator {
    return this.page.getByRole('button', { name: 'Save and return to overview', exact: true });
  }

  /** A plain link, not a govukButton, so it is addressed by the link role. */
  get linkCancel(): Locator {
    return this.page.getByRole('link', { name: 'Cancel and return to overview', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }
}

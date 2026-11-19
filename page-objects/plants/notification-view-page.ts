import type { Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import type { OpenViewOptions } from '@page-objects/shared/base-page';
import { NOTIFICATION_REFERENCE_PATTERN, ViewHeader } from '@page-objects/shared/view-header';
import { pageLoadWait } from '@config/timeouts';

export const checkYourAnswersHeadingText = 'Check your answers';

export class PlantsNotificationViewPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'notification-view');
  }

  readonly viewHeader = new ViewHeader(this.page);

  get heading(): Locator {
    const reviewHeadings = [NOTIFICATION_REFERENCE_PATTERN, checkYourAnswersHeadingText].join('|');
    return this.page.getByRole('main').getByRole('heading', { level: 1, name: new RegExp(`^(${reviewHeadings})$`) });
  }

  async open(referenceNumber: string, { attemptSignIn = true, waitForReview = true, ...identity }: OpenViewOptions = {}): Promise<void> {
    await super.open(referenceNumber, { attemptSignIn, ...identity });
    if (attemptSignIn && waitForReview) {
      await this.heading.waitFor(pageLoadWait);
    }
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue', exact: true });
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
  card(title: string): Locator {
    return this.page.locator('.govuk-summary-card').filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }
  change(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }
  rowKeys(cardTitle: string): Locator {
    return this.card(cardTitle).locator('.govuk-summary-list__key');
  }
  row(cardTitle: string, key: string): Locator {
    return this.card(cardTitle)
      .locator('.govuk-summary-list__row')
      .filter({ has: this.page.locator('.govuk-summary-list__key').getByText(key, { exact: true }) });
  }
  changeAddress(cardTitle: string): Locator {
    return this.card(cardTitle).getByRole('link', { name: /^Change/ });
  }
  editDetails(cardTitle: string): Locator {
    return this.card(cardTitle).getByRole('link', { name: /^Edit details/ });
  }
}

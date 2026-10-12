import type { Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';

export class PlantsNotificationViewPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'notification-view');
  }

  /** The review's level-1 heading: the reference on a draft's check answers or a submitted view, the review title on an amendment. */
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: /^(Check your answers|GBN-HRP-\d{2}-[0-9A-Z]{6})$/ });
  }
  /** The level-1 heading of a draft's check answers or a submitted notification's view, named exactly its reference. */
  viewHeading(reference: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: reference, exact: true });
  }
  get dateSubmitted(): Locator {
    return this.page.getByText(/^Date submitted: /);
  }
  get dateCreated(): Locator {
    return this.page.getByText(/^Date created: /);
  }
  /** The status bar's tag on an amendment, and the header's tag on a draft's review or a submitted view. */
  override get statusTag(): Locator {
    return this.page.getByRole('main').locator('.govuk-tag');
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
  /** The primary "Amend this notification" button in a submitted view's header. */
  get btnAmend(): Locator {
    return this.page.getByRole('button', { name: 'Amend this notification', exact: true });
  }
  /** The button group in a view's header, holding Delete notification, with Amend this notification on a submitted view. */
  get headerActions(): Locator {
    return this.page.locator('.govuk-button-group').filter({ has: this.btnDelete });
  }
  /** Used only to assert that plants offers no Copy as new. */
  get btnCopyAsNew(): Locator {
    return this.page.getByRole('button', { name: 'Copy as new' });
  }
  /** The "Import reference numbers" section of a submitted view. */
  get importReferenceNumbers(): Locator {
    return this.page.getByRole('region', { name: 'Import reference numbers' });
  }
  /** The value of the import reference row named `key`. */
  importReference(key: string): Locator {
    return this.importReferenceNumbers
      .locator('.govuk-summary-list__row')
      .filter({ has: this.page.getByRole('term').and(this.page.getByText(key, { exact: true })) })
      .locator('.govuk-summary-list__value');
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

import { type Locator, type Page } from '@playwright/test';
import { pageLoadWait } from '@config/timeouts';
import { NotificationPage } from '@page-objects/base/base-page';

export class NotificationViewPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'notification-view');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Review your notification' });
  }

  get journeyStrip(): Locator {
    return this.page.locator('.app-journey-strip');
  }

  get referenceNumberCaption(): Locator {
    return this.journeyStrip;
  }

  get btnCopyAsNew(): Locator {
    return this.page.getByRole('button', { name: 'Copy as new' });
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete' });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  get cancelAmendment(): Locator {
    return this.page.getByRole('link', { name: 'Cancel amendment' });
  }

  changeLink(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name });
  }

  summaryCard(name: string): Locator {
    return this.page.locator('.govuk-summary-card', { hasText: name });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  /** The summary-list row whose accessible term is the role, selected directly
   * rather than climbing to it, so no XPath parent-axis hop is needed. */
  partyRow(card: string, role: string): Locator {
    return this.summaryCard(card)
      .locator('.govuk-summary-list__row')
      .filter({ has: this.page.getByRole('term').and(this.page.getByText(role, { exact: true })) });
  }

  /** A summary list has no error state of its own, so an outstanding role
   * carries its message in the row's value cell — the first definition of the
   * row, ahead of the actions cell. */
  partyError(card: string, role: string): Locator {
    return this.partyRow(card, role).getByRole('definition').first();
  }

  async open(journeyId: string, attemptSignIn: boolean = true): Promise<void> {
    await super.open(journeyId, attemptSignIn);
    if (attemptSignIn) await this.heading.waitFor(pageLoadWait);
  }
}

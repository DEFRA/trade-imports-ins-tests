import { type Locator, type Page } from '@playwright/test';
import { pageLoadWait } from '@config/timeouts';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsNotificationViewPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'notification-view');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Review your notification' });
  }

  get journeyStrip(): Locator {
    return this.page.locator('.app-journey-strip');
  }

  /** The heading while a template is being created: the same page in template mode. */
  get templateHeading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Review your template' });
  }

  get statusTag(): Locator {
    return this.journeyStrip.locator('.govuk-tag');
  }

  get btnSaveTemplate(): Locator {
    return this.page.getByRole('button', { name: 'Save template', exact: true });
  }

  get sectionHeadings(): Locator {
    return this.page.getByRole('main').getByRole('heading', { level: 2 });
  }

  get cardErrors(): Locator {
    return this.page.locator('.govuk-summary-card .govuk-error-message');
  }

  get missingValues(): Locator {
    return this.page.locator('.app-summary-list__value--missing');
  }

  /** The row terms of one card. */
  cardKeys(card: string): Locator {
    return this.summaryCard(card).locator('.govuk-summary-list__key');
  }

  /** The value of the card's row whose term is exactly `key`. */
  rowValue(card: string, key: string): Locator {
    return this.summaryCard(card)
      .locator('.govuk-summary-list__row')
      .filter({ has: this.page.getByRole('term').and(this.page.getByText(key, { exact: true })) })
      .getByRole('definition')
      .first();
  }

  /** A card by its title alone, so a card of another name never matches by its content. */
  cardTitled(title: string): Locator {
    return this.page.locator('.govuk-summary-card__title', { hasText: title });
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

  /** The row's own link to edit the address copied onto this notification —
   * the card keeps the one Change link that re-picks from the book. */
  editPartyDetails(card: string, role: string): Locator {
    return this.partyRow(card, role).getByRole('link', { name: 'Edit details' });
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

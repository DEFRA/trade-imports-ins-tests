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

  /** The level-1 heading of a submitted notification's view, named exactly its reference. */
  viewHeading(reference: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: reference, exact: true });
  }

  get dateSubmitted(): Locator {
    return this.page.getByText(/^Date submitted: /);
  }

  /** The status bar's tag on a draft or amendment, and the header's tag on a submitted view. */
  override get statusTag(): Locator {
    return this.page.getByRole('main').locator('.govuk-tag');
  }

  get resubmitHeading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Review before re-submitting' });
  }

  /** On the review, Cancel amend is the button beside Continue, not the status bar link. */
  override get cancelAmend(): Locator {
    return this.page.getByRole('button', { name: 'Cancel amend', exact: true });
  }

  get statusBarCancelAmend(): Locator {
    return this.journeyStrip.getByRole('link', { name: 'Cancel amend', exact: true });
  }

  get referenceNumberCaption(): Locator {
    return this.journeyStrip;
  }

  get btnCopyAsNew(): Locator {
    return this.page.getByRole('button', { name: 'Copy as new' });
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete', exact: true });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  changeLink(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name });
  }

  /** The card whose title heading is exactly `name`. */
  summaryCard(name: string): Locator {
    return this.page.locator('.govuk-summary-card').filter({ has: this.page.getByRole('heading', { name, exact: true }) });
  }

  /** A commodity card holds one block per species, headed with the species name. */
  speciesBlockHeading(card: Locator, species: string): Locator {
    return card.getByRole('heading', { level: 4, name: species, exact: true });
  }

  summaryValue(card: Locator, key: string): Locator {
    return card
      .locator('.govuk-summary-list__row', { has: this.page.getByText(key, { exact: true }) })
      .locator('.govuk-summary-list__value');
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

  /** Opens the address without waiting for a review heading, for a view that redirects. */
  async visit(journeyId: string): Promise<void> {
    await super.open(journeyId);
  }

  async open(journeyId: string, attemptSignIn: boolean = true): Promise<void> {
    await super.open(journeyId, attemptSignIn);
    if (attemptSignIn) {
      await this.page
        .getByRole('heading', {
          level: 1,
          name: new RegExp(`^(Review your notification|Review before re-submitting|${journeyId})$`),
        })
        .waitFor(pageLoadWait);
    }
  }
}

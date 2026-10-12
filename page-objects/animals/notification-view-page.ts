import { type Locator, type Page } from '@playwright/test';
import { pageLoadWait } from '@config/timeouts';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsNotificationViewPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'notification-view');
  }

  /** The review's level-1 heading: the reference on a draft's review or a submitted view, the review title on an amendment. */
  get heading(): Locator {
    return this.page.getByRole('heading', {
      level: 1,
      name: /^(Review your notification|Review before re-submitting|GBN-AG-\d{2}-[0-9A-Z]{6})$/,
    });
  }

  /** An amendment's review heading, by its wording. */
  get reviewTitleHeading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Review your notification' });
  }

  /** The level-1 heading of a submitted notification's view, named exactly its reference. */
  viewHeading(reference: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: reference, exact: true });
  }

  /** The warning in the header of a notification submitted without its health certificate. */
  get actionRequiredWarning(): Locator {
    return this.page.locator('.govuk-warning-text').filter({ hasText: 'You need to upload a health certificate' });
  }

  /** The inline error under "4. Uploaded documents", which follows the section heading. */
  get documentsSectionError(): Locator {
    return this.page.locator('#documents-section ~ .govuk-error-message').first();
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

  /** The heading while a template is being created: the same page in template mode. */
  get templateHeading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Review your template' });
  }

  /** The status bar's tag, which reads Template while a template is being created. */
  get journeyStripTag(): Locator {
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

  /** The primary "Amend this notification" button in a view's header. */
  get btnAmend(): Locator {
    return this.page.getByRole('button', { name: 'Amend this notification', exact: true });
  }

  /** The button group in a view's header, holding Copy as new and Delete, with Amend this notification on a submitted view. */
  get headerActions(): Locator {
    return this.page.locator('.govuk-button-group').filter({ has: this.btnCopyAsNew });
  }

  /** The "Import reference numbers" section of a view's header. */
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

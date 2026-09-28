import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

/**
 * Where the consignment is going, picked from the organisation's address book.
 *
 * The page asks one of three questions and the heading says which: potatoes and
 * a consignment still on its way are asked for the place of destination, and one
 * that has already arrived is asked where it is being kept now.
 *
 * The whole page is one form and the search button, the paging links and the
 * primary are all part of it, so the picker needs no client JavaScript: search
 * is a submit, paging is a link carrying the term and the ticked row in its
 * query string, and a row ticked on one page survives to the save on another.
 */
export class PlantsPlaceOfDestinationPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'destinations/select');
  }

  /** The h1, whichever of the three questions the page is asking — for waiting
   * on the page rather than asserting which question it asked. */
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  headingNamed(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name, exact: true });
  }

  /** The sentence under the heading, which changes with the question. Matched in
   * full: the three states differ by wording alone. */
  descriptionNamed(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }

  /**
   * A results row addressed by the address it offers. The tick itself carries a
   * visually hidden "Select {name}", which is the row's only accessible name —
   * the visible name sits in the next cell.
   */
  address(name: string): Locator {
    return this.page.getByRole('radio', { name: `Select ${name}`, exact: true });
  }

  get search(): Locator {
    return this.page.getByLabel('Search', { exact: true });
  }

  get btnSearch(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  /** "Showing {shown} of {total} addresses" — the table's caption, and the only
   * place the page size and the size of the book are stated. */
  get resultsCaption(): Locator {
    return this.page.locator('.govuk-table__caption');
  }

  get noMatches(): Locator {
    return this.page.getByText('No addresses match your search.', { exact: true });
  }

  /**
   * The "Selected address: {name}" inset, which is how a row ticked on a page
   * the trader has since left is shown to still be the answer.
   */
  selectedAddress(name: string): Locator {
    return this.page.getByText(`Selected address: ${name}`, { exact: true });
  }

  /** The inset itself, for proving there is no selection at all. */
  get selectedAddressInset(): Locator {
    return this.page.locator('.govuk-inset-text');
  }

  /** govukPagination labels each number link `aria-label="Page {number}"`, so that
   * — not the bare number — is the link's accessible name. */
  pageLink(number: number): Locator {
    return this.page.getByRole('link', { name: `Page ${number}`, exact: true });
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

  /** Search is a server round-trip over the whole book, so the results only
   * settle once the submit has come back. */
  async searchFor(term: string): Promise<void> {
    await this.search.fill(term);
    await this.btnSearch.click();
  }
}

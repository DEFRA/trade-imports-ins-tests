import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

/**
 * The contact for the consignment, picked from the organisation's address book.
 *
 * The same picker as the destination and consignor pages — search is a submit,
 * paging is a link carrying the term and the ticked row, and a row ticked on one
 * page survives to the save on another — with two differences of its own: the
 * answer saved is a copy of the record, and a save with nothing ticked is allowed
 * and leaves the task row Not yet started.
 */
export class PlantsConsignmentContactSelectPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'consignment/contact/select');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Contact address for consignment', exact: true });
  }

  /**
   * A results row addressed by the address it offers. The tick itself carries a
   * visually hidden "Select {name}", which is the row's only accessible name —
   * the visible name sits in the next cell.
   */
  address(name: string): Locator {
    return this.page.getByRole('radio', { name: `Select ${name}`, exact: true });
  }

  /** Every row tick on the page, for proving none of them is checked. */
  get addresses(): Locator {
    return this.page.getByRole('radio');
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
    return this.page.getByText(/^Showing \d+ of \d+ addresses$/, { exact: true });
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
    return this.page.getByText(/^Selected address:/);
  }

  /** govukPagination labels each number link `aria-label="Page {number}"`, so that
   * — not the bare number — is the link's accessible name. */
  pageLink(number: number): Locator {
    return this.page.getByRole('link', { name: `Page ${number}`, exact: true });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  get btnSaveAndReturn(): Locator {
    return this.page.getByRole('button', { name: 'Save and return to overview', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert');
  }

  /** Search is a server round-trip over the whole book, so the results only
   * settle once the submit has come back. */
  async searchFor(term: string): Promise<void> {
    await this.search.fill(term);
    await this.btnSearch.click();
  }
}

import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

/**
 * The commodities list — the page that owns the collection.
 *
 * A load with no lines redirects to the entry sub-page, so the list is only
 * ever seen with a line saved or straight after a change of commodity type
 * emptied it, which is the one state that reports itself with `?removed=`.
 */
export class PlantsCommoditiesPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'commodities');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Commodities in the consignment' });
  }

  get table(): Locator {
    return this.page.getByRole('table');
  }

  /** The saved lines alone — the table's head row is a row too. */
  get lineRows(): Locator {
    return this.table.locator('tbody tr');
  }

  get emptyState(): Locator {
    return this.page.getByText('You have not added any commodities yet.');
  }

  /** A govukButton with an href, which govuk-frontend renders with role="button". */
  get btnAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Add another commodity', exact: true });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  /**
   * The row actions name their line by its position on the page, not by the
   * index the href carries: the visually hidden suffix that tells one Change
   * from the next reads "commodity 1" for the first row.
   */
  linkChange(position: number): Locator {
    return this.page.getByRole('link', { name: `Change commodity ${position}`, exact: true });
  }

  btnRemove(position: number): Locator {
    return this.page.getByRole('button', { name: `Remove commodity ${position}`, exact: true });
  }

  get removedBanner(): Locator {
    return this.page.getByRole('region', { name: 'Commodities removed' });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  /** The list as a change of commodity type leaves it, reporting what it dropped. */
  removedUrl(journeyId: string, removed: number): string {
    return `${this.expectedUrl(journeyId)}?removed=${removed}`;
  }
}

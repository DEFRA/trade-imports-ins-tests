import { type Locator } from '@playwright/test';
import type { SortByValue } from '@domain/constants/sort-by-values';
import { BasePage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export type ResultsRange = {
  start: number;
  end: number;
  total: number;
};

export class NotificationDashboardPage extends BasePage {
  readonly expectedUrl = SET_BASES.liveAnimals;

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Import notification service' });
  }

  get btnCreateNewNotification(): Locator {
    return this.page.getByRole('button', { name: 'Start a new notification' });
  }

  get dropdownSort(): Locator {
    return this.page.getByLabel('Sort by');
  }

  get btnUpdateSort(): Locator {
    return this.page.getByRole('button', { name: 'Update sort' });
  }

  get filterHeading(): Locator {
    return this.page.getByRole('heading', { level: 3, name: 'Filter notifications' });
  }

  get searchForm(): Locator {
    return this.page.getByTestId('notification-search-form');
  }

  get inputReferenceSearch(): Locator {
    return this.searchForm.getByLabel('Keyword or reference');
  }

  get btnSearch(): Locator {
    return this.searchForm.getByRole('button', { name: 'Search' });
  }

  get resultsLabel(): Locator {
    return this.page.locator('.notification-list__results');
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  get notificationCards(): Locator {
    return this.page.locator('.govuk-summary-card');
  }

  notificationCard(reference: string): Locator {
    return this.notificationCards.filter({ hasText: reference });
  }

  notificationCardAt(index: number): Locator {
    return this.notificationCards.nth(index);
  }

  private cardField(card: Locator, term: string): Locator {
    return card.locator('dt').filter({ hasText: term }).locator('xpath=following-sibling::dd[1]');
  }

  notificationCardDetails(index: number) {
    const card = this.notificationCardAt(index);
    return {
      heading: card.getByRole('heading', { level: 3 }),
      commodity: this.cardField(card, 'Commodity'),
      origin: this.cardField(card, 'Origin'),
      arrivalAtDestination: this.cardField(card, 'Arrival at destination'),
      consignee: this.cardField(card, 'Consignee'),
      consignor: this.cardField(card, 'Consignor'),
      status: this.cardField(card, 'Status'),
      dateCreated: this.cardField(card, 'Date created'),
    };
  }

  async searchFor(reference: string): Promise<void> {
    await this.page.getByLabel('Keyword or reference').fill(reference);
    await this.page.getByRole('button', { name: 'Search', exact: true }).click();
    await this.page.getByLabel('Keyword or reference').waitFor();
  }

  /** Server-side dashboard search via GET ?referenceNumber=. */
  async searchForReference(referenceNumber: string): Promise<void> {
    await this.inputReferenceSearch.fill(referenceNumber);
    await Promise.all([
      this.page.waitForURL((url) => (url.searchParams.get('referenceNumber') ?? '') === referenceNumber),
      this.btnSearch.click(),
    ]);
  }

  get totalResults(): Locator {
    return this.page.getByText(/^Showing (?:1 Result|\d+(?: to \d+)? of \d+ Results)$/);
  }

  async getResultsRange(): Promise<ResultsRange | null> {
    const text = (await this.totalResults.textContent())?.trim() ?? '';
    const match = text.match(/^Showing (\d+)(?: to (\d+))? of (\d+) Results$/);
    if (!match) return null;
    return {
      start: Number(match[1]),
      end: Number(match[2] ?? match[1]),
      total: Number(match[3]),
    };
  }

  formatResultsRangeLabel({ start, end, total }: ResultsRange): string {
    if (total === 1) return 'Showing 1 Result';
    if (start === end) return `Showing ${start} of ${total} Results`;
    return `Showing ${start} to ${end} of ${total} Results`;
  }

  get pagination(): Locator {
    return this.page.locator('.govuk-pagination');
  }

  get linkNextPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Next', exact: true });
  }

  get linkPreviousPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Previous', exact: true });
  }

  async getPaginationTotalPages(): Promise<number> {
    const range = await this.getResultsRange();
    if (!range) throw new Error('Could not parse the dashboard results range');

    const currentPage = this.currentPageFromUrl();
    const pageSize = currentPage === 1 ? range.end : Math.floor((range.start - 1) / (currentPage - 1));
    return Math.ceil(range.total / pageSize);
  }

  async openDashboardPage(pageNumber: number): Promise<void> {
    await this.navigateToFrontend(pageNumber <= 1 ? this.expectedUrl : `${this.expectedUrl}?page=${pageNumber}`);
    await this.heading.waitFor({ state: 'visible' });
    await this.waitForNotificationList();
  }

  async goToLastPage(): Promise<number> {
    const totalPages = await this.getPaginationTotalPages();
    await this.openDashboardPage(totalPages);
    return totalPages;
  }

  currentPageFromUrl(): number {
    const pageParam = new URL(this.page.url()).searchParams.get('page');
    const page = Number.parseInt(pageParam ?? '1', 10);
    return Number.isNaN(page) ? 1 : page;
  }

  async waitForNotificationList(): Promise<void> {
    await this.resultsLabel.waitFor({ state: 'visible', timeout: 10000 });
  }

  async sortBy(sortByValue: SortByValue): Promise<void> {
    await this.dropdownSort.selectOption(sortByValue);
    await this.btnUpdateSort.click();
  }

  copyAsNew(reference: string): Locator {
    return this.notificationCard(reference).getByRole('button', {
      name: `Copy as new notification ${reference}`,
    });
  }

  btnCopyAsNew(reference: string): Locator {
    return this.copyAsNew(reference);
  }

  amend(reference: string): Locator {
    return this.notificationCard(reference).getByRole('button', {
      name: `Amend notification ${reference}`,
    });
  }

  btnAmend(reference: string): Locator {
    return this.amend(reference);
  }

  view(reference: string): Locator {
    return this.notificationCard(reference).getByRole('link', {
      name: `View notification ${reference}`,
    });
  }

  viewLink(reference: string): Locator {
    return this.view(reference);
  }

  resume(reference: string): Locator {
    return this.notificationCard(reference).getByRole('link', {
      name: `Resume notification ${reference}`,
    });
  }

  delete(reference: string): Locator {
    return this.notificationCard(reference).getByRole('link', {
      name: `Delete notification ${reference}`,
    });
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToFrontend(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);

    if (attemptSignIn) {
      try {
        await this.heading.waitFor({ state: 'visible', timeout: 5000 });
        await this.waitForNotificationList();
      } catch {
        console.warn('Auth retry triggered — initial sign-in did not land on dashboard within 5s');
        await this.navigateToFrontend(this.expectedUrl);
        await this.signInWhenRequested(true);
        await this.heading.waitFor({ state: 'visible', timeout: 5000 });
        await this.waitForNotificationList();
      }
    }
  }
}

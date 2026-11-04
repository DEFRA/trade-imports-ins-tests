import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';
import { escapeRegex } from '@page-objects/shared/escape-regex';
import { opensAtExpectedUrl, type OpensAtExpectedUrlOptions } from '@page-objects/shared/opens-at-expected-url';
import type { AddressType, AddressUse } from '@domain/shared/constants/address-types';
import { useFilterOptionTexts, type AddressBookTab } from '@domain/ins/constants/address-book-types';

type ListPageOpenOptions = Omit<OpensAtExpectedUrlOptions, 'query'> & { addressType?: AddressType };

export class InsAddressBookListPage extends opensAtExpectedUrl(BasePage) {
  readonly expectedUrl = '/address-book';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Address book' });
  }

  /** The URL of the list opened on a tab. */
  tabUrl(tab: AddressBookTab): RegExp {
    return new RegExp(`${escapeRegex(this.expectedUrl)}\\?addressType=${tab.addressType}$`);
  }

  get intro(): Locator {
    return this.page.getByText('Manage your addresses for use across all your import notifications', { exact: true });
  }

  get btnAddNewAddress(): Locator {
    return this.page.getByRole('button', { name: 'Add a new address' });
  }

  get filterSummary(): Locator {
    return this.page.getByText('Filter addresses', { exact: true });
  }

  get inputSearch(): Locator {
    return this.page.getByRole('searchbox', { name: 'Search', exact: true });
  }

  get btnSearch(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  get resultsLine(): Locator {
    return this.page.getByTestId('address-book-results-label');
  }

  get columnHeaders(): Locator {
    return this.page.getByRole('columnheader');
  }

  get bodyRows(): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  get linkClearSearch(): Locator {
    return this.page.getByRole('link', { name: 'Clear search', exact: true });
  }

  get mainLinks(): Locator {
    return this.page.getByRole('main').getByRole('link');
  }

  get pagination(): Locator {
    return this.page.locator('.govuk-pagination');
  }

  get linkNextPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Next page', exact: true });
  }

  row(name: string): Locator {
    return this.page.getByRole('row', { name });
  }

  nameCell(name: string): Locator {
    return this.row(name).getByRole('cell').nth(0);
  }

  usesCell(name: string): Locator {
    return this.row(name).getByRole('cell').nth(1);
  }

  addressCell(name: string): Locator {
    return this.row(name).getByRole('cell').nth(2);
  }

  countryCell(name: string): Locator {
    return this.row(name).getByRole('cell').nth(3);
  }

  get tabLinks(): Locator {
    return this.page.getByRole('navigation', { name: 'Address types' }).getByRole('link');
  }

  get selectedTab(): Locator {
    return this.tabLinks.and(this.page.locator('[aria-current="page"]'));
  }

  get panelHeading(): Locator {
    return this.page.getByRole('main').getByRole('heading', { level: 2 });
  }

  tabLink(label: string): Locator {
    return this.tabLinks.filter({ hasText: new RegExp(`^${escapeRegex(label)}$`) });
  }

  get viewLinks(): Locator {
    return this.mainLinks.filter({ hasText: /^View / });
  }

  pageLink(pageNumber: number): Locator {
    return this.page.getByRole('link', { name: `Page ${pageNumber}`, exact: true });
  }

  viewLink(name: string): Locator {
    return this.page.getByRole('link', { name: `View ${name}`, exact: true });
  }

  get selectUseFilter(): Locator {
    return this.page.getByLabel('Type', { exact: true });
  }

  get useFilterOptions(): Locator {
    return this.selectUseFilter.locator('option');
  }

  get selectedUseFilterOption(): Locator {
    return this.selectUseFilter.locator('option:checked');
  }

  private async openFilter(): Promise<void> {
    if (!(await this.inputSearch.isVisible())) {
      await this.filterSummary.click();
    }
  }

  async chooseUseFilter(use: AddressUse): Promise<void> {
    await this.openFilter();
    await this.selectUseFilter.selectOption({ label: useFilterOptionTexts[use] });
  }

  async filter({ term, use, submitWith }: { term: string; use: AddressUse; submitWith: 'button' | 'enter' }): Promise<void> {
    await this.chooseUseFilter(use);
    await this.search(term, { submitWith });
  }

  async search(term: string, { submitWith }: { submitWith: 'button' | 'enter' }): Promise<void> {
    await this.openFilter();
    await this.inputSearch.fill(term);
    if (submitWith === 'enter') {
      await this.inputSearch.press('Enter');
    } else {
      await this.btnSearch.click();
    }
  }

  async followTab(tab: AddressBookTab): Promise<void> {
    await this.tabLink(tab.label).click();
  }

  async waitForTabListing(tab: AddressBookTab, { searchTerm }: { searchTerm?: string } = {}): Promise<void> {
    await this.page.waitForURL(
      (url) =>
        url.pathname === this.expectedUrl &&
        url.searchParams.get('addressType') === tab.addressType &&
        (searchTerm === undefined || url.searchParams.get('q') === searchTerm),
    );
  }

  async followResultPagesUntilRowShows(name: string): Promise<boolean> {
    while ((await this.row(name).count()) === 0) {
      if ((await this.linkNextPage.count()) === 0) {
        return false;
      }
      await this.linkNextPage.click();
    }
    return true;
  }

  override async open({ addressType, ...options }: ListPageOpenOptions = {}): Promise<void> {
    await super.open({ ...options, query: addressType ? { addressType } : undefined });
  }
}

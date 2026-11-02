import { Locator } from '@playwright/test';
import { BasePage, type OpenOptions } from '@page-objects/shared/base-page';
import { typeOptionTexts, type AddressBookTab, type AddressType, type AddressUse } from '@domain/shared/constants/address-types';

type ListPageOpenOptions = OpenOptions & { addressType?: AddressType };

export class InsAddressBookListPage extends BasePage {
  readonly expectedUrl = '/address-book';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Address book' });
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

  typeCell(name: string): Locator {
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
    return this.tabLinks.filter({ hasText: new RegExp(`^${label}$`) });
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

  get selectType(): Locator {
    return this.page.getByLabel('Type', { exact: true });
  }

  get typeOptions(): Locator {
    return this.selectType.locator('option');
  }

  get selectedTypeOption(): Locator {
    return this.selectType.locator('option:checked');
  }

  private async openFilter(): Promise<void> {
    if (!(await this.inputSearch.isVisible())) {
      await this.filterSummary.click();
    }
  }

  async chooseType(use: AddressUse): Promise<void> {
    await this.openFilter();
    await this.selectType.selectOption({ label: typeOptionTexts[use] });
  }

  async filter({ term, use, submitWith }: { term: string; use: AddressUse; submitWith: 'button' | 'enter' }): Promise<void> {
    await this.chooseType(use);
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

  async followResultPagesUntilRowShows(name: string): Promise<boolean> {
    while ((await this.row(name).count()) === 0) {
      if ((await this.linkNextPage.count()) === 0) {
        return false;
      }
      await this.linkNextPage.click();
    }
    return true;
  }

  async open({ attemptSignIn = true, addressType, ...identity }: ListPageOpenOptions = {}): Promise<void> {
    const query = addressType ? `?${new URLSearchParams({ addressType })}` : '';
    await this.page.goto(`${this.expectedUrl}${query}`);
    await this.signInWhenRequested(attemptSignIn, identity);
  }
}

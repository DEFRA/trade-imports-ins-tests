import { type Locator, type Page, type Response } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import {
  pickerNoMatchesMessage,
  pickerResultsGroup,
  pickerResultsHeading,
  pickerResultsSummary,
  pickerSearchBox,
  pickerSearchButton,
  pickerSearchRow,
} from '@page-objects/shared/address-picker-results';

export type AddressCellParts = {
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
};

export class AnimalsPartyPickerPage extends NotificationPage {
  static expectedAddressCellText({ addressLine1, addressLine2, townOrCity, county, postcode }: AddressCellParts): string {
    const placeLine = [townOrCity, county, postcode].filter(Boolean).join(', ');
    return [addressLine1, addressLine2, placeLine].filter(Boolean).join('\n');
  }

  constructor(
    page: Page,
    slug: string,
    readonly expectedHeading: string,
  ) {
    super(page, slug);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: this.expectedHeading });
  }

  get headingRow(): Locator {
    return this.heading.locator('xpath=ancestor::*[contains(@class, "govuk-grid-row")][1]');
  }

  get headingRowParts(): Locator {
    return this.headingRow.locator('.govuk-caption-l, h1, a, button');
  }

  get descriptionUnderHeading(): Locator {
    return this.headingRow.locator('xpath=following-sibling::*[1][self::p]');
  }

  get resultsHeading(): Locator {
    return pickerResultsHeading(this.page);
  }

  get resultsSummary(): Locator {
    return pickerResultsSummary(this.page);
  }

  get resultsGroup(): Locator {
    return pickerResultsGroup(this.page);
  }

  party(name: string): Locator {
    return this.page.getByRole('radio', { name: `Select ${name}`, exact: true });
  }

  partyRow(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.party(name) });
  }

  partyAddressCell(name: string): Locator {
    return this.partyRow(name).getByRole('cell').nth(2);
  }

  partyAddressCellText(name: string): Promise<string> {
    return this.partyAddressCell(name).evaluate((cell) => (cell as HTMLElement).innerText);
  }

  partyViewLink(name: string): Locator {
    return this.partyRow(name).getByRole('link', { name: `View ${name}`, exact: true });
  }

  partyActionCell(name: string): Locator {
    return this.partyRow(name).getByRole('cell').last();
  }

  get noMatchesMessage(): Locator {
    return pickerNoMatchesMessage(this.page);
  }

  get listedParties(): Locator {
    return this.resultsGroup.getByRole('radio');
  }

  async listedPartyIds(): Promise<string[]> {
    return Promise.all((await this.listedParties.all()).map((party) => party.inputValue()));
  }

  get checkedParties(): Locator {
    return this.resultsGroup.getByRole('radio', { checked: true });
  }

  get selectedAddress(): Locator {
    return this.page.getByText('Selected address:');
  }

  get searchBox(): Locator {
    return pickerSearchBox(this.page);
  }

  get searchRow(): Locator {
    return pickerSearchRow(this.page);
  }

  get searchButton(): Locator {
    return pickerSearchButton(this.page);
  }

  get addNewAddress(): Locator {
    return this.page.getByRole('button', { name: 'Add a new address' });
  }

  async search(term: string): Promise<void> {
    await this.searchBox.fill(term);
    const isSearchResponse = (response: Response): boolean =>
      response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith('/select');
    await Promise.all([this.page.waitForResponse(isSearchResponse), this.searchButton.click()]);
    await this.page.waitForLoadState('load');
  }

  async select(name: string): Promise<void> {
    await this.search(name);
    await this.party(name).check();
  }
}

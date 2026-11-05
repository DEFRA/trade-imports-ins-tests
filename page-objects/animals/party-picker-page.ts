import { expect, type Locator, type Page } from '@playwright/test';
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

export class AnimalsPartyPickerPage extends NotificationPage {
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

  partyDetailsLines(name: string): Locator {
    return this.partyRow(name).getByRole('group').getByRole('listitem');
  }

  async openPartyDetails(name: string): Promise<void> {
    await this.partyRow(name).getByText(`View details for ${name}`, { exact: true }).click();
  }

  get pagination(): Locator {
    return this.page.getByRole('navigation', { name: 'Pagination' });
  }

  paginationPageLink(pageNumber: number): Locator {
    return this.pagination.getByRole('link', { name: `Page ${pageNumber}`, exact: true });
  }

  get nextPageLink(): Locator {
    return this.pagination.getByRole('link', { name: 'Next page', exact: true });
  }

  async followNextUntilListed(name: string): Promise<void> {
    for (let pageNumber = 2; (await this.party(name).count()) === 0 && (await this.nextPageLink.count()) > 0; pageNumber += 1) {
      await this.nextPageLink.click();
      await expect(this.paginationPageLink(pageNumber)).toHaveAttribute('aria-current', 'page');
    }
  }

  get noMatchesMessage(): Locator {
    return pickerNoMatchesMessage(this.page);
  }

  get listedParties(): Locator {
    return this.resultsGroup.getByRole('radio');
  }

  get checkedParties(): Locator {
    return this.page.locator('input[type="radio"]:checked');
  }

  async listedPartyIds(): Promise<string[]> {
    return Promise.all((await this.listedParties.all()).map((party) => party.inputValue()));
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

  async select(name: string): Promise<void> {
    await this.searchBox.fill(name);
    await this.searchButton.click();
    await this.party(name).check();
  }
}

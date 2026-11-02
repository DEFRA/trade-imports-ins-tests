import { type Locator, type Page } from '@playwright/test';
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
  private static readonly SELECT_PREFIX = 'Select ';

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
    return this.page.getByRole('radio', { name: `${AnimalsPartyPickerPage.SELECT_PREFIX}${name}`, exact: true });
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

  partiesListedAbove(name: string, amongPartyIds: readonly string[]): Locator {
    const isAmongPartyIds = amongPartyIds.map((partyId) => `@value="${partyId}"`).join(' or ') || 'false()';
    return this.party(name).locator(`xpath=preceding::input[@type="radio"][${isAmongPartyIds}]`);
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

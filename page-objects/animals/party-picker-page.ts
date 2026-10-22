import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import {
  pickerResultsGroup,
  pickerResultsHeading,
  pickerResultsSummary,
  pickerSaveAndContinue,
  pickerSearchBox,
  pickerSearchButton,
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

  get selectedAddress(): Locator {
    return this.page.getByText('Selected address:');
  }

  get search(): Locator {
    return pickerSearchBox(this.page);
  }

  get searchButton(): Locator {
    return pickerSearchButton(this.page);
  }

  get saveAndContinue(): Locator {
    return pickerSaveAndContinue(this.page);
  }

  get addNewAddress(): Locator {
    return this.page.getByRole('button', { name: 'Add a new address' });
  }

  async select(name: string): Promise<void> {
    await this.search.fill(name);
    await this.searchButton.click();
    await this.party(name).check();
  }
}

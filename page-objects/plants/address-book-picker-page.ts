import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import {
  pickerNoMatchesMessage,
  pickerResultsHeading,
  pickerResultsSummary,
  pickerSearchBox,
  pickerSearchButton,
} from '@page-objects/shared/address-picker-results';

export abstract class PlantsAddressBookPickerPage extends PlantsNotificationPage {
  constructor(
    page: ConstructorParameters<typeof PlantsNotificationPage>[0],
    slug: string,
    private readonly currentAddressName: string,
  ) {
    super(page, slug);
  }

  abstract get heading(): Locator;

  address(name: string): Locator {
    return this.page.getByRole('radio', { name: `Select ${name}`, exact: true });
  }

  get search(): Locator {
    return pickerSearchBox(this.page);
  }

  get btnSearch(): Locator {
    return pickerSearchButton(this.page);
  }

  get resultsHeading(): Locator {
    return pickerResultsHeading(this.page);
  }

  get resultsSummary(): Locator {
    return pickerResultsSummary(this.page);
  }

  get noMatchesMessage(): Locator {
    return pickerNoMatchesMessage(this.page);
  }

  selectedAddress(name: string): Locator {
    return this.page.getByText(`Selected address: ${name}`, { exact: true });
  }

  get selectedAddressInset(): Locator {
    return this.page.locator('.govuk-inset-text');
  }

  get currentAddress(): Locator {
    return this.page.getByRole('region', { name: this.currentAddressName });
  }

  get editCurrentAddress(): Locator {
    return this.currentAddress.getByRole('link', { name: /^Edit details/ });
  }

  pageLink(number: number): Locator {
    return this.page.getByRole('link', { name: `Page ${number}`, exact: true });
  }

  async searchFor(term: string): Promise<void> {
    await this.search.fill(term);
    await this.btnSearch.click();
  }
}

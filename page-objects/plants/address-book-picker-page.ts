import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import {
  pickerAddressRadio,
  pickerLastCell,
  pickerNoMatchesMessage,
  paragraphUnderResultsHeading,
  pickerResultRows,
  pickerResultRowsOutsideCountry,
  pickerResultsGroup,
  pickerResultsHeading,
  pickerSearchBox,
  pickerSearchButton,
  pickerSearchRow,
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
    return pickerAddressRadio(this.page, name);
  }

  addressDetails(name: string): Locator {
    return pickerLastCell(this.page, name).getByRole('group');
  }

  addressDetailsToggle(name: string): Locator {
    return this.addressDetails(name).getByText('View details');
  }

  addressDetailsLines(name: string): Locator {
    return this.addressDetails(name).getByRole('listitem');
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

  get resultsHeading(): Locator {
    return pickerResultsHeading(this.page);
  }

  get resultsSummary(): Locator {
    return paragraphUnderResultsHeading(this.page);
  }

  get noMatchesMessage(): Locator {
    return pickerNoMatchesMessage(this.page);
  }

  get listedAddresses(): Locator {
    return pickerResultsGroup(this.page).getByRole('radio');
  }

  get listedRows(): Locator {
    return pickerResultRows(this.page);
  }

  listedRowsOutsideCountry(countryLabel: string): Locator {
    return pickerResultRowsOutsideCountry(this.page, countryLabel);
  }

  get checkedAddress(): Locator {
    return pickerResultsGroup(this.page).getByRole('radio', { checked: true });
  }

  get currentAddress(): Locator {
    return this.page.getByRole('region', { name: this.currentAddressName });
  }

  get editCurrentAddress(): Locator {
    return this.currentAddress.getByRole('link', { name: /^Edit details/ });
  }

  async search(term: string): Promise<void> {
    await this.searchBox.fill(term);
    await this.searchButton.click();
  }
}

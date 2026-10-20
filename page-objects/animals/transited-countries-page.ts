import { expect, type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { TypeAhead } from '@page-objects/shared/type-ahead';

export class AnimalsTransitedCountriesPage extends NotificationPage {
  private readonly country: TypeAhead;

  constructor(page: Page) {
    super(page, 'transit-countries');
    this.country = new TypeAhead(page, 'transitedCountry');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', {
      level: 1,
      name: 'Which countries will the consignment travel through?',
    });
  }

  // The country is an accessible-autocomplete type-ahead enhancing a native
  // <select>. With JavaScript the enhancement takes the select's id onto the
  // enhanced input and renames the select "transitedCountry-select"; without
  // JavaScript the select keeps the id and is the control. So `#transitedCountry`
  // is whichever of the two the user actually types into.
  get countryField(): Locator {
    return this.page.locator('#transitedCountry');
  }

  get addCountryButton(): Locator {
    return this.page.getByRole('button', { name: 'Add country', exact: true });
  }

  async addCountry(name: string): Promise<void> {
    await this.country.choose(name);
    await this.addCountryButton.click();
    await expect(this.row(name)).toBeVisible();
  }

  row(name: string): Locator {
    return this.page.getByRole('cell', { name, exact: true });
  }

  removeCountry(name: string): Locator {
    return this.page.getByRole('button', { name: `Remove ${name}` });
  }

  get addedCountries(): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('button', { name: /^Remove / }) });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

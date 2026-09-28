import { expect, type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class TransitedCountriesPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transit-countries');
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

  countryOption(name: string): Locator {
    return this.page.getByRole('option', { name, exact: true });
  }

  // Without JavaScript the field is still the select, chosen by option label.
  async addCountry(name: string): Promise<void> {
    // The enhancement is a module script, so it has run by DOMContentLoaded.
    // Waiting for that settles which element the id resolves to before the probe
    // reads it. With JavaScript off the event has already fired, so this is free.
    await this.page.waitForLoadState('domcontentloaded');
    const field = this.countryField;
    if ((await field.evaluate((el) => el.tagName)) === 'SELECT') {
      await field.selectOption({ label: name });
    } else {
      await field.click();
      await field.fill(name);
      await this.countryOption(name).click();
    }
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

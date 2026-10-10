import { expect, type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsTransitedCountriesPage extends NotificationPage {
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

  // The native select behind the type-ahead: hidden once enhanced, but still the
  // element that carries the country code and submits it with the form.
  get countrySelect(): Locator {
    return this.page.locator('select[name="transitedCountry"]');
  }

  // Every place offered, skipping the empty placeholder option.
  get countryOptions(): Locator {
    return this.countrySelect.locator('option:not([value=""])');
  }

  // A territory is coded by ISO 3166-2, the parent country code and a hyphen; a country's alpha-2 code has none.
  get territoryOptions(): Locator {
    return this.countrySelect.locator('option[value*="-"]');
  }

  // The working list travels with the page as hidden inputs, which is what Save and continue submits.
  get addedCountryCodes(): Locator {
    return this.page.locator('input[type="hidden"][name="transitedCountries"]');
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

  get addedCountriesTable(): Locator {
    return this.page.getByRole('table');
  }

  get emptyListSentence(): Locator {
    return this.page.getByText('You have not added any countries yet.', { exact: true });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

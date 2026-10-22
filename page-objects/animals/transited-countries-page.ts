import { expect, type Locator, type Page } from '@playwright/test';
import { EMPTY_TRANSIT_COUNTRIES_BODY_TEXT, EMPTY_TRANSIT_COUNTRIES_BUTTONS } from '@domain/animals/constants/transit-countries-page';
import { NotificationPage } from '@page-objects/shared/base-page';
import { TypeAhead } from '@page-objects/shared/type-ahead';

export class AnimalsTransitedCountriesPage extends NotificationPage {
  public readonly country: TypeAhead;

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

  get addedCountryNames(): Locator {
    return this.addedCountries.locator('td:first-child');
  }

  get bodyParagraphs(): Locator {
    return this.page.getByRole('main').getByRole('paragraph');
  }

  get formButtons(): Locator {
    return this.page.locator('form').getByRole('button');
  }

  async expectEmptyList(): Promise<void> {
    await expect(this.bodyParagraphs).toHaveText(EMPTY_TRANSIT_COUNTRIES_BODY_TEXT);
    await expect(this.formButtons).toHaveText(EMPTY_TRANSIT_COUNTRIES_BUTTONS);
  }

  get statusRegion(): Locator {
    return this.page.locator('#transit-countries-status');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

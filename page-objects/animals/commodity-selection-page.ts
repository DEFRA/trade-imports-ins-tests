import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export const SEARCH_HINT = 'You can search by common name (for example, cattle), commodity code (0102), or Latin name (Bos taurus).';
export const SELECT_COMMODITY_ERROR = 'Select a commodity';

export class AnimalsCommoditySelectionPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodities');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'What are you importing?' });
  }

  get itahcInset(): Locator {
    return this.page.getByText(
      'You must submit a separate notification for every single ITAHC. You must also submit a notification for goods that do not need an ITAHC.',
      { exact: true },
    );
  }

  get searchBox(): Locator {
    return this.page.getByLabel('Search for a commodity');
  }

  get searchHint(): Locator {
    return this.page.getByText(SEARCH_HINT, {
      exact: true,
    });
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  get selectedSummary(): Locator {
    return this.page.locator('#commodity-selection');
  }

  get clearAll(): Locator {
    return this.page.getByRole('button', { name: 'Clear all' });
  }

  get commodityCodeHelp(): Locator {
    return this.page.getByText('Help with commodity codes', { exact: true });
  }

  get tradeTariffLink(): Locator {
    return this.page.getByRole('link', { name: 'Trade Tariff tool (opens in a new tab)', exact: true });
  }

  async search(query: string): Promise<void> {
    await this.searchBox.fill(query);
    await this.searchButton.click();
  }

  species(name: string): Locator {
    return this.page.getByRole('checkbox', { name });
  }

  group(legend: string): Locator {
    return this.page.getByRole('group', { name: legend });
  }

  async selectSpecies(names: string[]): Promise<void> {
    for (const name of names) {
      await this.search(name);
      await this.species(name).check();
    }
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }
}

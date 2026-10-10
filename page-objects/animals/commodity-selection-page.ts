import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsCommoditySelectionPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodities');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'What are you importing?' });
  }

  get searchBox(): Locator {
    return this.page.getByLabel('Search for a commodity');
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  /** The panel listing what is already on the notification, headed with its count. */
  get selectionPanel(): Locator {
    return this.page.locator('#commodity-selection');
  }

  get clearAll(): Locator {
    return this.page.getByRole('button', { name: 'Clear all' });
  }

  /** The page lists nothing of its own accord — results only appear once a
   * query of at least three characters has been submitted. */
  async search(query: string): Promise<void> {
    await this.searchBox.fill(query);
    await this.searchButton.click();
  }

  species(name: string): Locator {
    return this.page.getByRole('checkbox', { name });
  }

  /** A species has no tick box until its own query puts it in the results, so
   * each name is searched for before it is ticked. Ticks made under an earlier
   * query ride back with the form, so they survive the next search. */
  async selectSpecies(names: string[]): Promise<void> {
    for (const name of names) {
      await this.search(name);
      await this.species(name).check();
    }
  }

  get inset(): Locator {
    return this.page.getByText(
      'You must submit a separate notification for every single ITAHC. You must also submit a notification for goods that do not need an ITAHC.',
    );
  }

  get searchHint(): Locator {
    return this.page.getByText('You can search by common name (for example, cattle), commodity code (0102), or Latin name (Bos taurus).');
  }

  get commodityCodeHelp(): Locator {
    return this.page.getByText('Help with commodity codes', { exact: true });
  }

  get tradeTariffLink(): Locator {
    return this.page.getByRole('link', { name: 'Trade Tariff tool (opens in a new tab)' });
  }

  get selectCommodityErrorLink(): Locator {
    return this.page.getByRole('link', { name: 'Select a commodity' });
  }

  /** The tick-box group a commodity's species are listed under, named by its legend. */
  group(legend: string): Locator {
    return this.page.getByRole('group', { name: legend });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }
}

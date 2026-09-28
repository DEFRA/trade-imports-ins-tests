import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class CommoditySelectionPage extends NotificationPage {
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

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

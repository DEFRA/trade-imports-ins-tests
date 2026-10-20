import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import type { CommodityLine } from '@domain/animals/constants/commodity-lines';

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

  commodityGroup(code: string): Locator {
    return this.page.getByRole('group', { name: code, exact: true });
  }

  species(line: CommodityLine): Locator {
    return this.commodityGroup(line.commodityCode).getByRole('checkbox', { name: line.latinName, exact: true });
  }

  /** A species has no tick box until its own query puts it in the results, so
   * each line is searched for before it is ticked. Ticks made under an earlier
   * query ride back with the form, so they survive the next search. */
  async selectSpecies(lines: CommodityLine[]): Promise<void> {
    for (const line of lines) {
      await this.search(line.searchTerm);
      await this.species(line).check();
    }
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }
}

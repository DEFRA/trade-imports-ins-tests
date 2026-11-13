import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { speciesLabel, type CommodityLine } from '@domain/animals/constants/commodity-lines';
import { SEARCH_HINT } from '@domain/animals/constants/commodity-selection-page';

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

  get noResults(): Locator {
    return this.page.locator('#commodity-search-results').getByText('No results found', { exact: true });
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

  commodityHeading(code: string): RegExp {
    return new RegExp(`^(.+ \\()?${code}\\)?$`);
  }

  commodityGroup(code: string): Locator {
    return this.page.getByRole('group', { name: this.commodityHeading(code) });
  }

  get commodityGroups(): Locator {
    return this.page.getByRole('group', { name: this.commodityHeading('\\d+') });
  }

  species(species: CommodityLine): Locator {
    return this.commodityGroup(species.commodityCode).getByRole('checkbox', { name: speciesLabel(species), exact: true });
  }

  boldMatchInSpeciesLabel(species: CommodityLine): Locator {
    return this.commodityGroup(species.commodityCode)
      .locator('label')
      .filter({ hasText: speciesLabel(species) })
      .getByRole('strong');
  }

  boldMatchInCommodityHeading(code: string): Locator {
    return this.commodityGroup(code).locator('legend').getByRole('strong');
  }

  async searchAndCheckSpecies(speciesList: CommodityLine[]): Promise<void> {
    for (const species of speciesList) {
      await this.search(species.searchTerm);
      await this.species(species).check();
    }
  }

  selectedCommodityHeading(code: string): Locator {
    return this.selectedSummary.getByText(new RegExp(`^(.+ \\()?${code}\\)?:$`));
  }

  speciesEntry(species: CommodityLine): Locator {
    return this.selectedSummary.getByRole('listitem').filter({
      has: this.page.getByText(species.latinName, { exact: true }),
      hasNot: this.page.getByRole('listitem'),
    });
  }

  removeButtonFor(species: CommodityLine): Locator {
    return this.selectedSummary.getByRole('button', { name: `Remove ${species.latinName}`, exact: true });
  }

  async pressRemoveSpecies(species: CommodityLine): Promise<void> {
    await this.removeButtonFor(species).click();
  }
}

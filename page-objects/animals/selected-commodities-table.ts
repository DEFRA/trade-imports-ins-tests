import { type Locator, type Page } from '@playwright/test';
import { speciesLabel, type CommodityLine } from '@domain/animals/constants/commodity-lines';

export class SelectedCommoditiesTable {
  constructor(private readonly page: Page) {}

  get table(): Locator {
    return this.page.getByRole('table', { name: 'Selected commodities' });
  }

  get bodyRows(): Locator {
    return this.table.locator('tbody').getByRole('row');
  }

  rowFor(species: CommodityLine): Locator {
    return this.table
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: species.commodityCode, exact: true }) })
      .filter({ hasText: speciesLabel(species) });
  }

  changeLinkFor(species: CommodityLine): Locator {
    return this.rowFor(species).getByRole('link', { name: new RegExp(`^Change\\s+${species.commodityCode}\\b`) });
  }

  removeButtonFor(species: CommodityLine): Locator {
    return this.rowFor(species).getByRole('button', { name: new RegExp(`^Remove\\s+${species.commodityCode}\\b`) });
  }

  codeCell(row: Locator): Locator {
    return row.getByRole('cell').nth(0);
  }

  speciesCell(row: Locator): Locator {
    return row.getByRole('cell').nth(1);
  }

  animalCountCell(row: Locator): Locator {
    return row.getByRole('cell').nth(2);
  }
}

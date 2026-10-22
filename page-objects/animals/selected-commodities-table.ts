import { type Locator, type Page } from '@playwright/test';

export class SelectedCommoditiesTable {
  constructor(private readonly page: Page) {}

  get table(): Locator {
    return this.page.getByRole('table', { name: 'Selected commodities' });
  }

  rowFor(commonName: string): Locator {
    return this.table.getByRole('row').filter({ has: this.page.getByRole('cell', { name: commonName, exact: true }) });
  }

  speciesCell(row: Locator): Locator {
    return row.getByRole('cell').nth(2);
  }
}

import { type Locator, type Page } from '@playwright/test';

export class SelectedCommoditiesTable {
  constructor(private readonly page: Page) {}

  get table(): Locator {
    return this.page.getByRole('table', { name: 'Selected commodities' });
  }

  get bodyRows(): Locator {
    return this.table.locator('tbody').getByRole('row');
  }

  rowFor(commonName: string): Locator {
    return this.table.getByRole('row').filter({ has: this.page.getByRole('cell', { name: commonName, exact: true }) });
  }

  changeLinkFor(commonName: string): Locator {
    return this.rowFor(commonName).getByRole('link', { name: `Change ${commonName}` });
  }

  codeCell(row: Locator): Locator {
    return row.getByRole('cell').nth(0);
  }

  commonNameCell(row: Locator): Locator {
    return row.getByRole('cell').nth(1);
  }

  speciesCell(row: Locator): Locator {
    return row.getByRole('cell').nth(2);
  }

  animalCountCell(row: Locator): Locator {
    return row.getByRole('cell').nth(3);
  }
}

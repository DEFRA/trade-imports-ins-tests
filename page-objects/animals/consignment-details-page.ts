import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsConsignmentDetailsPage extends NotificationPage {
  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, 'consignment-details');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Commodity details' });
  }

  get numberOfAnimals(): Locator {
    return this.page.getByLabel('Number of animals');
  }

  get numberOfPackages(): Locator {
    return this.page.getByLabel('Number of packages (when required)');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }

  get animalsRequiredErrorLink(): Locator {
    return this.page.getByRole('link', { name: 'Enter the number of animals' });
  }

  get caption(): Locator {
    return this.page.getByText('Description of the goods', { exact: true });
  }

  get headingBelowCaption(): Locator {
    return this.caption.locator('xpath=following-sibling::*[1]');
  }

  get selectedCommodities(): Locator {
    return this.page.getByRole('table', { name: 'Selected commodities' });
  }

  selectedCommodityRow(commodityCode: string): Locator {
    return this.selectedCommodities.getByRole('row').filter({ has: this.page.getByRole('cell', { name: commodityCode, exact: true }) });
  }

  speciesCell(row: Locator): Locator {
    return row.getByRole('cell').nth(2);
  }

  async fillEveryAnimalCount(count: string): Promise<void> {
    for (const box of await this.numberOfAnimals.all()) {
      await box.fill(count);
    }
  }
}

import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

export class PlantsConsignorSelectPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'consignors/select');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Consignor or exporter', exact: true });
  }

  address(name: string): Locator {
    return this.page.getByRole('radio', { name: `Select ${name}`, exact: true });
  }

  selectedAddress(name: string): Locator {
    return this.page.getByText(`Selected address: ${name}`, { exact: true });
  }

  async searchFor(term: string): Promise<void> {
    await this.page.getByLabel('Search', { exact: true }).fill(term);
    await this.page.getByRole('button', { name: 'Search', exact: true }).click();
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }
}

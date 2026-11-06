import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import { TypeAhead } from '@page-objects/shared/type-ahead';

export class PlantsCommodityDetailsPage extends PlantsNotificationPage {
  private readonly genusTypeAhead: TypeAhead;

  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'commodities/details');
    this.genusTypeAhead = new TypeAhead(page, 'genus');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Commodity details' });
  }

  get categoryGroup(): Locator {
    return this.page.getByRole('group', { name: 'What category of goods is this?' });
  }

  category(label: string): Locator {
    return this.page.getByRole('radio', { name: label, exact: true });
  }

  get categoryRadios(): Locator {
    return this.page.locator('input[name="category"]');
  }

  field(label: string): Locator {
    return this.page.getByLabel(label, { exact: true });
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue', exact: true });
  }

  get btnSaveAndAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Save and add another', exact: true });
  }

  editUrl(referenceNumber: string, index: number): string {
    return `${this.expectedUrl(referenceNumber)}?index=${index}`;
  }

  async selectGenus(label: string): Promise<void> {
    await this.genusTypeAhead.choose(label);
  }
}

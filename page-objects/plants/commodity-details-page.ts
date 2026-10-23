import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import { TypeAhead } from '@page-objects/shared/type-ahead';

/**
 * One commodity line, added or edited.
 *
 * The page asks in two steps: the category alone, then — once the line exists
 * and the model has scoped it — the fields that category asks for. Which is why
 * the primary control is "Continue" before a category is chosen and "Save and
 * continue" after it.
 */
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

  /** Every category on offer, however it is labelled — the count is the assertion. */
  get categoryRadios(): Locator {
    return this.page.locator('input[name="category"]');
  }

  /** A per-line field, addressed by the label the trader reads. */
  field(label: string): Locator {
    return this.page.getByLabel(label, { exact: true });
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue', exact: true });
  }

  get btnSaveAndAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Save and add another', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  /** The page as it is reached to edit a saved line, which it names by index. */
  editUrl(referenceNumber: string, index: number): string {
    return `${this.expectedUrl(referenceNumber)}?index=${index}`;
  }

  async selectGenus(label: string): Promise<void> {
    await this.genusTypeAhead.choose(label);
  }
}

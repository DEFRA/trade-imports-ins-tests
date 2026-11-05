import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import { TypeAhead } from '@page-objects/shared/type-ahead';

export class PlantsOriginPage extends PlantsNotificationPage {
  public readonly country: TypeAhead;

  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'origin');
    this.country = new TypeAhead(page, 'countryOfOrigin');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Origin of the import' });
  }

  get guidance(): Locator {
    return this.page.locator('.govuk-inset-text');
  }
}

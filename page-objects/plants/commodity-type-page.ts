import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';

export class PlantsCommodityTypePage extends PlantsNotificationPage {
  private readonly question = 'What are you importing?';

  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'commodity-type');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: this.question });
  }

  commodityType(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  get optionsError(): Locator {
    return this.page.getByRole('group', { name: this.question }).locator('.govuk-error-message');
  }

  get linesWarning(): Locator {
    return this.page.getByText('Changing your answer will remove the commodities you have already added.');
  }
}

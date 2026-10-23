import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

type CphNumberParts = { county?: string; parish?: string; holding?: string };

export class AnimalsCphNumberPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'cph-number');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add the county parish holding number (CPH)' });
  }

  get county(): Locator {
    return this.page.getByLabel('County', { exact: true });
  }

  get parish(): Locator {
    return this.page.getByLabel('Parish', { exact: true });
  }

  get holding(): Locator {
    return this.page.getByLabel('Holding number', { exact: true });
  }

  async fillCphNumber({ county = '12', parish = '345', holding = '6789' }: CphNumberParts = {}): Promise<void> {
    await this.county.fill(county);
    await this.parish.fill(parish);
    await this.holding.fill(holding);
  }
}

import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class ConsignmentDetailsPage extends NotificationPage {
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

  /**
   * Fills the animal count on every commodity line the page is showing. The
   * count is save-blocking per line, so a page carrying more than one line
   * will not save until each box holds a number — and `numberOfAnimals` is
   * ambiguous under strict mode once a second line is on the page.
   */
  async fillEveryAnimalCount(count: string): Promise<void> {
    for (const box of await this.numberOfAnimals.all()) {
      await box.fill(count);
    }
  }
}

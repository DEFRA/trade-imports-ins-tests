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

  get caption(): Locator {
    return this.page.getByText('Description of the goods', { exact: true });
  }

  get selectedCommodities(): Locator {
    return this.page.getByRole('table', { name: 'Selected commodities' });
  }

  get errorSummaryLinks(): Locator {
    return this.page.getByRole('alert').getByRole('link');
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

  get packagesRequiredErrorLink(): Locator {
    return this.page.getByRole('link', { name: 'Enter the number of packages' });
  }

  /**
   * Fills the number of packages on every commodity line that asks for one.
   * The package count is save-blocking on each of those lines, so a page
   * carrying more than one will not save until each box holds a number. It
   * fills nothing on a page whose lines ask for none.
   */
  async fillEveryPackageCount(count: string): Promise<void> {
    for (const box of await this.numberOfPackages.all()) {
      await box.fill(count);
    }
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

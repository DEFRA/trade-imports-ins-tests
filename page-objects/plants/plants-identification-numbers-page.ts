import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

export class PlantsIdentificationNumbersPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'identification-numbers');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Identification numbers', exact: true });
  }

  get supplier(): Locator {
    return this.page.getByLabel('Identification number of the supplier of the plants', { exact: true });
  }

  get producer(): Locator {
    return this.page.getByLabel('Identification number of the producer of the potatoes', { exact: true });
  }

  get crop(): Locator {
    return this.page.getByLabel('Crop identification number', { exact: true });
  }

  get consignment(): Locator {
    return this.page.getByLabel('Consignment number (optional)', { exact: true });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }
}

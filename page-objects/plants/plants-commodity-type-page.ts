import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

/**
 * The journey's entry question and the opening run's first step, so the create
 * POST lands here rather than on the Overview.
 */
export class PlantsCommodityTypePage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'commodity-type');
  }

  /** The fieldset legend is the page heading — a single-question radios page. */
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'What are you importing?' });
  }

  commodityType(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  /**
   * The govukWarningText the page carries only while the notification holds
   * commodity lines — the categories partition by type, so a change of answer
   * removes every line the new type cannot hold.
   */
  get linesWarning(): Locator {
    return this.page.getByText('Changing your answer will remove the commodities you have already added.');
  }

  /** A plain link, not a govukButton, so it is addressed by the link role. */
  get linkCancel(): Locator {
    return this.page.getByRole('link', { name: 'Cancel and return to overview', exact: true });
  }
}

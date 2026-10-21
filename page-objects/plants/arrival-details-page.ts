import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import { DatePicker } from '@page-objects/shared/date-picker';
import { TypeAhead } from '@page-objects/shared/type-ahead';

export class PlantsArrivalDetailsPage extends PlantsNotificationPage {
  private readonly placeOfLanding: TypeAhead;

  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'arrival-details');
    this.placeOfLanding = new TypeAhead(page, 'proposedPlaceOfLanding');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Arrival details' });
  }

  get arrivalDate(): Locator {
    return this.page.locator('#arrivalDate');
  }

  get arrivalDatePicker(): DatePicker {
    return new DatePicker(this.page, 'arrivalDate');
  }

  dateQuestionLabelled(label: string): Locator {
    return this.page.getByRole('textbox', { name: label, exact: true });
  }

  get arrivalTime(): Locator {
    return this.page.locator('#arrivalTime');
  }

  get arrivalTimeLabel(): Locator {
    return this.page.locator('label[for="arrivalTime"]');
  }

  get proposedPlaceOfLanding(): Locator {
    return this.page.locator('#proposedPlaceOfLanding');
  }

  get placeOfLandingOptions(): Locator {
    return this.page.locator('select[name="proposedPlaceOfLanding"] option:not([value=""])');
  }

  async selectPlaceOfLanding(name: string): Promise<void> {
    await this.placeOfLanding.choose(name);
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  get linkCancel(): Locator {
    return this.page.getByRole('link', { name: 'Cancel and return to overview', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }
}

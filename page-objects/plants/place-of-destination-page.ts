import { type Locator } from '@playwright/test';
import { PlantsAddressBookPickerPage } from '@page-objects/plants/address-book-picker-page';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';

export class PlantsPlaceOfDestinationPage extends PlantsAddressBookPickerPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'destinations/select', 'Current place of destination');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  headingNamed(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name, exact: true });
  }

  descriptionNamed(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }
}

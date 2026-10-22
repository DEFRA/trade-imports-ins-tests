import { type Locator } from '@playwright/test';
import { PlantsAddressBookPickerPage } from '@page-objects/plants/address-book-picker-page';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';

export class PlantsConsignorSelectPage extends PlantsAddressBookPickerPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'consignors/select', 'Current consignor');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Consignor', exact: true });
  }
}

import { Locator } from '@playwright/test';
import { InsAddressBookRecordPage } from '@page-objects/ins/address-book/record-page';

export class InsAddressBookTransporterViewPage extends InsAddressBookRecordPage {
  expectedUrl(transporterId: string): string {
    return `/address-book/transporter/${transporterId}`;
  }

  heading(transporterName: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: transporterName });
  }

  get btnEdit(): Locator {
    return this.page.getByRole('button', { name: 'Edit' });
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete' });
  }
}

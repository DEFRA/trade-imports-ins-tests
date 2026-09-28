import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export type PartyRole = 'Consignor or exporter' | 'Place of destination' | 'Place of origin' | 'Consignee' | 'Importer';

export class AddressesPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'addresses');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Consignment addresses' });
  }

  partyRow(role: PartyRole): Locator {
    return this.page.locator('.govuk-summary-list__row', {
      has: this.page.getByText(role, { exact: true }),
    });
  }

  addParty(role: PartyRole): Locator {
    return this.partyRow(role).getByRole('link', { name: 'Add' });
  }

  changeParty(role: PartyRole): Locator {
    return this.partyRow(role).getByRole('link', { name: 'Change' });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }
}

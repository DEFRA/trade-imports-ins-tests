import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export type PartyRole = 'Consignor or exporter' | 'Place of destination' | 'Place of origin' | 'Consignee' | 'Importer';

export class AnimalsAddressesPage extends NotificationPage {
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

  /** Edits the copy held on this notification, as opposed to Change, which re-picks from the book. */
  editPartyDetails(role: PartyRole): Locator {
    return this.partyRow(role).getByRole('link', { name: 'Edit details' });
  }

  /** The CPH number row. The CPH page is reached only from this row. */
  get cphRow(): Locator {
    return this.page.locator('.govuk-summary-list__row', {
      has: this.page.getByText('County parish holding (CPH) number', { exact: true }),
    });
  }

  get addCph(): Locator {
    return this.cphRow.getByRole('link', { name: 'Add' });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }
}

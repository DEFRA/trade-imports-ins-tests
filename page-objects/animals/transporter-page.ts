import { type Locator, type Page } from '@playwright/test';
import { NotificationPage, originOf } from '@page-objects/shared/base-page';
import { pickerSearchBox, pickerSearchButton } from '@page-objects/shared/address-picker-results';

export class AnimalsTransporterPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Transporter details' });
  }

  get resultsHeading(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Select a transporter' });
  }

  get resultsGroup(): Locator {
    return this.page.getByRole('group', { name: 'Select a transporter' });
  }

  transporter(name: string): Locator {
    return this.page.getByRole('radio', { name: `Select ${name}`, exact: true });
  }

  rowFor(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell', { name, exact: true }) });
  }

  approvalNumberCell(name: string): Locator {
    return this.rowFor(name).getByRole('cell').nth(3);
  }

  rowStatusTag(name: string): Locator {
    return this.rowFor(name).locator('.govuk-tag');
  }

  viewDetailsLink(name: string): Locator {
    return this.rowFor(name).getByRole('link', { name: `View details ${name}`, exact: true });
  }

  /** Follows View details out of the animals service, then completes any sign-in the receiving service asks for. */
  async viewDetails(name: string): Promise<void> {
    await this.leaveOriginThenSignIn(originOf('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL'), () => this.viewDetailsLink(name).click());
  }

  get searchBox(): Locator {
    return pickerSearchBox(this.page);
  }

  get searchButton(): Locator {
    return pickerSearchButton(this.page);
  }

  get listedTransporters(): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('radio') });
  }

  /** The name each listed row shows, in the order the rows are shown. */
  get listedTransporterNames(): Locator {
    return this.listedTransporters.locator('td:nth-child(2)');
  }

  get addTransporter(): Locator {
    return this.page.getByRole('button', { name: 'Add a transporter' });
  }
}

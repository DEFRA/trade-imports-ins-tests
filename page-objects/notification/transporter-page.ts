import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

/** The transporter list — every transporter the trader can use, commercial and
 * private together. Adding one that is not listed is a route off this page. */
export class TransporterPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Transporter details' });
  }

  /** The list is a table with a radio in the leading column, so the radio's own
   * label is a visually hidden "Select <name>" — the name itself is the cell in
   * the Name column, not the control's accessible name. Same shape as the party
   * picker's results table. */
  transporter(name: string): Locator {
    return this.page.getByRole('radio', { name: `Select ${name}`, exact: true });
  }

  /** The govuk button macro renders the href as role=button. */
  get addTransporter(): Locator {
    return this.page.getByRole('button', { name: 'Add a transporter' });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

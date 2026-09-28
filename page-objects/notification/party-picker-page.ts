import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class PartyPickerPage extends NotificationPage {
  constructor(
    page: Page,
    slug: string,
    readonly expectedHeading: string,
  ) {
    super(page, slug);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: this.expectedHeading });
  }

  party(name: string): Locator {
    return this.page.getByRole('radio', { name: `Select ${name}`, exact: true });
  }

  get search(): Locator {
    return this.page.getByLabel('Search');
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get addNewAddress(): Locator {
    return this.page.getByRole('link', { name: 'Add a new address' });
  }

  /** Search then tick — the book is shared and newest-first, so a fixture may not be on page one. */
  async select(name: string): Promise<void> {
    await this.search.fill(name);
    await this.searchButton.click();
    await this.party(name).check();
  }
}

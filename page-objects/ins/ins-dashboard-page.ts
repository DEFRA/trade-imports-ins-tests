import { type Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class InsDashboardPage extends BasePage {
  readonly expectedUrl = '/';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Dashboard', exact: true });
  }

  get inputReferenceSearch(): Locator {
    return this.page.getByLabel('Search by notification reference');
  }

  get btnSearch(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  get noSearchResults(): Locator {
    return this.page.getByTestId('dashboard-no-results');
  }

  row(referenceNumber: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(referenceNumber) });
  }

  /**
   * The action cell's accessible name is "View" plus a visually-hidden reference
   * number (`notification-dashboard-helper.js`/`buildTableRows`), so match loosely
   * across the two text nodes rather than a single exact string.
   */
  viewLink(referenceNumber: string): Locator {
    return this.page.getByRole('link', { name: new RegExp(`View.*${referenceNumber}`, 's') });
  }

  async searchForReference(referenceNumber: string): Promise<void> {
    await this.inputReferenceSearch.fill(referenceNumber);
    await this.btnSearch.click();
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToInsFrontend(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);
    if (attemptSignIn) await this.heading.waitFor();
  }
}

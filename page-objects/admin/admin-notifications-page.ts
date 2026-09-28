import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class AdminNotificationsPage extends BasePage {
  readonly expectedUrl = '/notifications';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Notifications' });
  }

  get inputReferenceNumber(): Locator {
    return this.page.getByRole('textbox', { name: 'Reference number' });
  }

  get btnDeleteByReferenceNumber(): Locator {
    return this.page.getByRole('button', { name: 'Delete notification by' });
  }

  get checkBoxSelectAll(): Locator {
    return this.page.getByRole('checkbox', { name: 'Select all notifications', exact: true });
  }

  get tableRows(): Locator {
    return this.page.getByRole('table').getByRole('row');
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete', exact: true });
  }

  get btnConfirm(): Locator {
    return this.page.getByRole('button', { name: 'Confirm' });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  get alertSuccess(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'Success' }) });
  }

  get alertImportant(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'Important' }) });
  }

  get pagination(): Locator {
    return this.page.getByRole('navigation', { name: 'Pagination' });
  }

  get resultsCount(): Locator {
    return this.page.getByTestId('results-count');
  }

  async currentPageReferences(): Promise<string[]> {
    return this.page.locator('.notification-checkbox').evaluateAll((elements) => (elements as HTMLInputElement[]).map((el) => el.value));
  }

  async getTotalElements(): Promise<number> {
    // Wait for the page itself to render before deciding whether the count
    // element is absent because we're still loading, or absent because the
    // template legitimately omitted it (empty state).
    await this.heading.waitFor({ state: 'visible' });

    if ((await this.resultsCount.count()) === 0) {
      return 0;
    }

    const text = (await this.resultsCount.textContent()) ?? '';
    const match = text.match(/(\d+)/);
    if (!match) {
      throw new Error(`Could not parse totalElements from results-count text: "${text}"`);
    }
    return Number(match[1]);
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.page.goto(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);
  }

  async deleteByReferenceNumber(): Promise<void> {
    // The delete button's confirmation dialog is wired up by a client-side module
    // script. Wait for the network to settle first so the click doesn't race the
    // script attaching its listener, which would otherwise leave the dialog closed.
    await this.page.waitForLoadState('networkidle');
    await this.btnDeleteByReferenceNumber.click();
  }

  tableRowByReference(referenceNumber: string): Locator {
    return this.page.getByRole('table').getByRole('row', { name: referenceNumber });
  }

  checkboxNotificationByReference(referenceNumber: string): Locator {
    return this.page.getByRole('checkbox', { name: `Select notification ${referenceNumber}` });
  }

  async findRowByReference(referenceNumber: string, maxPages: number = 10): Promise<void> {
    await this.page.goto(this.expectedUrl);

    const checkbox = this.checkboxNotificationByReference(referenceNumber);
    const nextLink = this.pagination.getByRole('link', { name: 'Next page' });

    for (let visited = 0; visited < maxPages; visited++) {
      // isVisible() does not auto-wait, so anchor each iteration on the always-rendered
      // heading — the page is server-rendered, so once it arrives the table (when present)
      // is already in the DOM. The table itself only renders when notifications exist.
      await this.heading.waitFor();
      if (await checkbox.isVisible()) {
        return;
      }
      if (!(await nextLink.isVisible())) {
        throw new Error(`Notification ${referenceNumber} not found; no more pages.`);
      }
      const currentUrl = this.page.url();
      await nextLink.click();
      await this.page.waitForURL((url) => url.toString() !== currentUrl);
    }

    throw new Error(`Notification ${referenceNumber} not found within ${maxPages} pages.`);
  }
}

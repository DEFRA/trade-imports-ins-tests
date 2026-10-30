import { Locator } from '@playwright/test';
import { BasePage, type OpenOptions } from '@page-objects/shared/base-page';

export class AnimalsAdminNotificationsPage extends BasePage {
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

  get deleteDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Are you sure you want to delete the following notifications?' });
  }

  get btnConfirm(): Locator {
    return this.page.getByRole('button', { name: 'Confirm' });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
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
    await this.waitForPageRendered();

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

  async open({ attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
    await this.page.goto(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn, identity);
  }

  async deleteByReferenceNumber(): Promise<void> {
    await this.waitForDeleteDialogScript();
    await this.btnDeleteByReferenceNumber.click();
  }

  private async waitForPageRendered(): Promise<void> {
    await this.heading.waitFor({ state: 'visible' });
  }

  private async waitForDeleteDialogScript(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  tableRowByReference(referenceNumber: string): Locator {
    return this.page.getByRole('table').getByRole('row', { name: referenceNumber });
  }

  checkboxNotificationByReference(referenceNumber: string): Locator {
    return this.page.getByRole('checkbox', { name: `Select notification ${referenceNumber}` });
  }

  async openPageShowingNotification(referenceNumber: string, maxPages: number = 10): Promise<void> {
    await this.navigateToAdminPortal(this.expectedUrl);

    const checkbox = this.checkboxNotificationByReference(referenceNumber);
    const nextLink = this.pagination.getByRole('link', { name: 'Next page' });

    for (let visited = 0; visited < maxPages; visited++) {
      await this.waitForPageRendered();
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

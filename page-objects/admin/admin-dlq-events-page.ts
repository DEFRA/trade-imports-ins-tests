import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class AdminDlqEventsPage extends BasePage {
  readonly expectedUrl = '/dlq-events';

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToAdminPortal(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'DLQ process' });
  }

  get tableRows(): Locator {
    return this.page.getByRole('table').locator('tbody tr');
  }

  /** The DLQ row whose Id cell holds the given message id (the body's eventId). */
  rowById(id: string): Locator {
    return this.tableRows.filter({ hasText: id });
  }

  get btnReplayAll(): Locator {
    return this.page.getByRole('button', { name: 'Replay all', exact: true });
  }

  get btnDeleteAll(): Locator {
    return this.page.getByRole('button', { name: 'Delete all', exact: true });
  }

  get btnConfirmDeleteAll(): Locator {
    return this.page.getByRole('button', { name: 'Confirm delete all', exact: true });
  }

  get deleteAllDialog(): Locator {
    return this.page.getByRole('dialog', { name: /delete all messages/i });
  }

  get bannerSuccess(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'Success' }) });
  }
}

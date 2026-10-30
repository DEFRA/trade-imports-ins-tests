import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';

export class AnimalsAdminDlqEventsPage extends BasePage {
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

  rowContainingMessageId(messageId: string): Locator {
    return this.tableRows.filter({ hasText: messageId });
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
}

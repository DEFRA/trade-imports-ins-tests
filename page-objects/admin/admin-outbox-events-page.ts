import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class AdminOutboxEventsPage extends BasePage {
  readonly expectedUrl = '/outbox-events';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Outbox events' });
  }

  get inputReferenceNumber(): Locator {
    return this.page.getByLabel('Notification reference number');
  }

  get btnSearch(): Locator {
    return this.page.getByRole('button', { name: 'Search' });
  }

  get tableRows(): Locator {
    return this.page.getByRole('table').locator('tbody tr');
  }

  get emptyStateMessage(): Locator {
    return this.page.locator('p.govuk-body', { hasText: 'No outbox events found for' });
  }

  cellVersion(rowIndex: number): Locator {
    return this.tableRows.nth(rowIndex).locator('td').nth(0);
  }

  cellEventType(rowIndex: number): Locator {
    return this.tableRows.nth(rowIndex).locator('td').nth(1);
  }

  get eventTypeCells(): Locator {
    return this.tableRows.locator('td:nth-child(2)');
  }

  cellTimestamp(rowIndex: number): Locator {
    return this.tableRows.nth(rowIndex).locator('td').nth(2);
  }

  linkViewJson(rowIndex: number): Locator {
    return this.tableRows.nth(rowIndex).getByRole('group').getByText('View JSON');
  }

  cellDataPre(rowIndex: number): Locator {
    return this.tableRows.nth(rowIndex).locator('pre');
  }

  get btnReplay(): Locator {
    return this.page.getByRole('button', { name: 'Replay all events' });
  }

  get bannerSuccess(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'Success' }) });
  }

  get bannerError(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) });
  }

  get dlqWarning(): Locator {
    return this.page.locator('.govuk-warning-text');
  }
}

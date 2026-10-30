import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';

export class AnimalsAdminOutboxEventsPage extends BasePage {
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

  get eventTypeCells(): Locator {
    return this.tableRows.locator('td:nth-child(2)');
  }

  get btnReplay(): Locator {
    return this.page.getByRole('button', { name: 'Replay all events' });
  }
}

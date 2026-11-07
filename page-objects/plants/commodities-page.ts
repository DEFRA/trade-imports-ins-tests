import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import { urlPatternWithTrail } from '@page-objects/shared/base-page';

export class PlantsCommoditiesPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'commodities');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Commodities in the consignment' });
  }

  get table(): Locator {
    return this.page.getByRole('table');
  }

  get lineRows(): Locator {
    return this.table.locator('tbody tr');
  }

  get emptyState(): Locator {
    return this.page.getByText('You have not added any commodities yet.');
  }

  get btnAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Add another commodity', exact: true });
  }

  linkChange(position: number): Locator {
    return this.page.getByRole('link', { name: `Change commodity ${position}`, exact: true });
  }

  btnRemove(position: number): Locator {
    return this.page.getByRole('button', { name: `Remove commodity ${position}`, exact: true });
  }

  get removedBanner(): Locator {
    return this.page.getByRole('region', { name: 'Commodities removed' });
  }

  /** Matches the list address that reports `removed` removed lines, with or without a trail after it. */
  removedUrlPattern(referenceNumber: string, removed: number): RegExp {
    return urlPatternWithTrail(this.expectedUrl(referenceNumber), `?removed=${removed}`);
  }
}

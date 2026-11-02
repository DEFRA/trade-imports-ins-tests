import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsTransporterAddPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters/add');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Choose a transporter type' });
  }

  transporterType(name: 'Commercial' | 'Private'): Locator {
    const RADIO_LABEL_BY_TYPE = {
      Commercial: 'Commercial',
      Private: 'Private transporter',
    } as const;
    return this.page.getByRole('radio', {
      name: RADIO_LABEL_BY_TYPE[name],
      exact: true,
    });
  }
}

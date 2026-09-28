import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import type { YesNoValue } from '@domain/shared/constants/yes-no-values';

export class AnimalsAdditionalDetailsPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'additional-details');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Additional details' });
  }

  certifiedFor(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  containsUnweanedAnimals(value: YesNoValue): Locator {
    return this.page
      .getByRole('group', { name: 'Does the consignment contain any unweaned animals?' })
      .getByRole('radio', { name: value, exact: true });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

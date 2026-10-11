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

  get certifiedForGroup(): Locator {
    return this.page.getByRole('group', { name: 'What are the animals certified for?' });
  }

  certifiedFor(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  containsUnweanedAnimals(value: YesNoValue): Locator {
    return this.page
      .getByRole('group', { name: 'Does the consignment contain any unweaned animals?' })
      .getByRole('radio', { name: value, exact: true });
  }

  // A browser cannot un-choose a radio, so this stands in for a form that reaches the service with nothing chosen.
  async clearChoices(): Promise<void> {
    await this.page.locator('form input[type="radio"]').evaluateAll((inputs) => {
      inputs.forEach((input) => {
        (input as HTMLInputElement).checked = false;
      });
    });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

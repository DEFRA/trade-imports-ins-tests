import { type Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';

export class AnimalsTemplateNamePage extends BasePage {
  readonly newUrl = `${SET_BASES.liveAnimals}/templates/new`;

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Enter template name' });
  }

  get caption(): Locator {
    return this.page.getByText('Create a new template', { exact: true });
  }

  /** The label is visually hidden, so the heading is what names the field on screen. */
  get inputName(): Locator {
    return this.page.getByRole('textbox', { name: 'Enter template name' });
  }

  get hints(): Locator {
    return this.page.locator('main .govuk-hint');
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  get linkCancel(): Locator {
    return this.page.getByRole('link', { name: 'Cancel and return to manage templates' });
  }
}

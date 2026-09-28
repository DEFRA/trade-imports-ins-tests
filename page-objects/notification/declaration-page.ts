import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class DeclarationPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'declaration');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Declaration' });
  }

  get confirmation(): Locator {
    return this.page.getByRole('checkbox', { name: /I confirm that I have reviewed/ });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }
}

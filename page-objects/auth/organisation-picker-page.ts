import { Page, Locator } from '@playwright/test';

/**
 * defra-id-stub's "Choose your organisation" screen, shown after sign-in only
 * for identities with more than one organisation (POST /organisations, radio
 * value keyed by sbi).
 */
export class OrganisationPickerPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Choose your organisation' });
  }

  organisation(sbi: string): Locator {
    return this.page.getByRole('radio', { name: new RegExp(`SBI ${sbi}$`) });
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  async select(sbi: string): Promise<void> {
    await this.organisation(sbi).check();
    await this.btnContinue.click();
  }
}

import { type Locator } from '@playwright/test';
import { BasePage, requireBaseUrl } from '@page-objects/shared/base-page';

export class InsNotificationTypePage extends BasePage {
  readonly expectedUrl = '/notification-type';

  /** The fieldset legend is the page heading, with the caption inside it. */
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: /What are you importing\?/ });
  }

  get caption(): Locator {
    return this.page.locator('h1 .govuk-caption-l');
  }

  get options(): Locator {
    return this.page.getByRole('radio');
  }

  option(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue', exact: true });
  }

  get buttons(): Locator {
    return this.page.locator('main').getByRole('button');
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert');
  }

  get errorSummaryLink(): Locator {
    return this.errorSummary.getByRole('link', { name: 'Select what you are importing' });
  }

  get inlineError(): Locator {
    return this.page.locator('.govuk-error-message');
  }

  get journeyStrip(): Locator {
    return this.page.locator('.app-journey-strip');
  }

  get phaseBanner(): Locator {
    return this.page.locator('.govuk-phase-banner');
  }

  /**
   * The hand-over leaves INS for the journey frontend, which may ask the worker to sign in
   * first, so wait for the origin to change and then complete any sign-in.
   */
  async continueToService(): Promise<void> {
    const insOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL')).origin;
    await Promise.all([this.page.waitForURL((url) => url.origin !== insOrigin), this.btnContinue.click()]);
    await this.completeSignInIfRequested();
  }
}

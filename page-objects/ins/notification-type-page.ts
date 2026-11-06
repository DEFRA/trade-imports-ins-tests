import { type Locator } from '@playwright/test';
import { BasePage, originOf, type OpenOptions } from '@page-objects/shared/base-page';
import type { NotificationTypeOption } from '@domain/ins/constants/notification-types';

export class InsNotificationTypePage extends BasePage {
  readonly expectedUrl = '/notification-type';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: /What are you importing\?/ });
  }

  get caption(): Locator {
    return this.page.locator('h1 .govuk-caption-l');
  }

  get options(): Locator {
    return this.page.getByRole('radio');
  }

  get checkedOptions(): Locator {
    return this.page.getByRole('radio', { checked: true });
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

  get links(): Locator {
    return this.page.locator('main').getByRole('link');
  }

  get optionsError(): Locator {
    return this.radiosError(/What are you importing\?/);
  }

  get hints(): Locator {
    return this.page.locator('.govuk-hint');
  }

  get phaseBanner(): Locator {
    return this.page.locator('.govuk-phase-banner').filter({ hasText: 'Alpha' });
  }

  async open({ attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
    await this.navigateToInsFrontend(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn, identity);
    if (attemptSignIn) await this.heading.waitFor();
  }

  /** Presses Continue, waits for the browser to leave the INS origin, then completes any sign-in the receiving service asks for. */
  async continueToService(): Promise<void> {
    await this.leaveOriginThenSignIn(originOf('TRADE_IMPORTS_INS_FRONTEND_BASE_URL'), () => this.btnContinue.click());
  }

  async chooseNotificationType(type: NotificationTypeOption): Promise<void> {
    await this.option(type.label).check();
    await this.continueToService();
  }
}

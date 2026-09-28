import { Page, Locator } from '@playwright/test';
import { defaultPassword, defaultUser } from '@config/users';

export class SignInPage {
  readonly expectedUrl = new RegExp('/dcidmtest.onmicrosoft.com/oauth2/authresp$');
  readonly headingName = 'Sign in using Government Gateway';

  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: this.headingName });
  }

  get inputUserId(): Locator {
    return this.page.getByRole('textbox', { name: 'Government Gateway user ID' });
  }

  get inputPassword(): Locator {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  get btnSignIn(): Locator {
    return this.page.getByRole('button', { name: 'Sign in' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) });
  }

  async signIn(options?: { userId?: string; password?: string }): Promise<void> {
    const userId = options?.userId ?? defaultUser.crn;
    const password = options?.password ?? defaultPassword;
    await this.inputUserId.fill(userId);

    if (process.env.PWDEBUG) {
      await this.inputPassword.fill(password);
    } else {
      await this.fillSensitiveInput(this.inputPassword, password);
    }

    await this.btnSignIn.click();
  }

  // evaluate() instead of fill() — avoids logging the value in traces.
  private async fillSensitiveInput(input: Locator, value: string): Promise<void> {
    await input.waitFor({ state: 'visible' });
    await input.evaluate((el, val) => {
      const element = el as HTMLInputElement;
      element.value = val;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  }
}

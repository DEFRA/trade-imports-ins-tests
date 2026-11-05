import { Page, Locator } from '@playwright/test';

export class SignInErrorPage {
  readonly headingName = 'Sorry, we are unable to sign you in.';

  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: this.headingName });
  }

  async openUnauthorised(): Promise<void> {
    await this.page.goto('/auth/sign-in-oidc?code=invalid&state=invalid');
    await this.heading.waitFor();
  }
}

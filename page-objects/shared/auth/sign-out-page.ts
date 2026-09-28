import { Page, Locator } from '@playwright/test';

export class SignOutPage {
  readonly path = '/auth/sign-out';
  readonly expectedUrl = new RegExp('/idphub/b2c/b2c_1a_cui_cpdev_signupsigninsfi/signout($|\\?)');

  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'You have signed out' });
  }
}

import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';

export class AnimalsAdminAboutPage extends BasePage {
  readonly expectedUrl = '/about';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'About', exact: true });
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToAdminPortal(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);
    if (attemptSignIn) await this.heading.waitFor();
  }
}

import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class AdminDashboardPage extends BasePage {
  readonly expectedUrl = '/';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Home' });
  }

  get linkSignOut(): Locator {
    return this.page.getByRole('link', { name: 'Sign out' });
  }

  get btnNotifications(): Locator {
    return this.page.getByRole('button', { name: 'Notifications' });
  }

  get btnOutboxEvents(): Locator {
    return this.page.getByRole('button', { name: 'Outbox events' });
  }

  get btnDlqProcess(): Locator {
    return this.page.getByRole('button', { name: 'DLQ process' });
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToAdminPortal(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);

    if (attemptSignIn) {
      // The auth stub can fail under concurrent load. If we don't land on the
      // dashboard within a short grace period, retry the whole auth flow once.
      try {
        await this.heading.waitFor({ state: 'visible', timeout: 5000 });
      } catch {
        console.warn('Auth retry triggered — initial sign-in did not land on dashboard within 5s');
        await this.page.goto('/');
        await this.signInWhenRequested(true);
      }
    }
  }
}

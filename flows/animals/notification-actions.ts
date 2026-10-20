import { pageLoadWait, timeouts } from '@config/timeouts';
import type { AnimalsPages, SharedPages } from '@page-objects';

export class AnimalsNotificationActions {
  constructor(
    private readonly animalsPages: AnimalsPages,
    private readonly pages: SharedPages,
  ) {}

  async toNotificationView(journeyId: string): Promise<void> {
    await this.animalsPages.notificationView.open(journeyId);
  }

  /** From the notification view, changes the country of origin and returns to the view. */
  async changeCountryOfOrigin(country: string): Promise<void> {
    await this.animalsPages.notificationView.changeLink('Change import details').click();
    await this.animalsPages.originOfImport.heading.waitFor(pageLoadWait);
    await this.animalsPages.originOfImport.country.choose(country);
    await this.animalsPages.originOfImport.saveAndReturn.click();
    await this.animalsPages.notificationView.heading.waitFor(pageLoadWait);
  }

  async amendNotification(journeyId: string): Promise<void> {
    await this.animalsPages.dashboard.open();
    await this.animalsPages.dashboard.searchForReference(journeyId);
    await this.animalsPages.dashboard.amend(journeyId).click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
  }

  /** Copies a notification from its dashboard card, landing on the copy's overview. */
  async copyNotification(journeyId: string): Promise<void> {
    await this.animalsPages.dashboard.open();
    await this.animalsPages.dashboard.searchForReference(journeyId);
    await this.animalsPages.dashboard.copyAsNew(journeyId).click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
  }

  /**
   * Discards an in-progress amendment, restoring the submitted version. Waits on
   * `?cancelled=1` rather than the view's heading, which the error page also has.
   */
  async cancelAmend(journeyId: string): Promise<void> {
    await this.toNotificationView(journeyId);
    await this.animalsPages.notificationView.cancelAmend.click();
    await this.animalsPages.notificationCancelAmend.heading.waitFor(pageLoadWait);
    await this.animalsPages.notificationCancelAmend.confirm.click();
    await this.pages.page.waitForURL(/\/notification-view\?cancelled=1$/, { timeout: timeouts.medium });
  }

  async deleteNotification(journeyId: string): Promise<void> {
    await this.animalsPages.dashboard.open();
    await this.animalsPages.dashboard.searchFor(journeyId);
    await this.animalsPages.dashboard.delete(journeyId).click();
    await this.pages.page.getByRole('heading', { name: 'Delete this notification?' }).waitFor(pageLoadWait);
    await this.pages.page.getByRole('button', { name: 'Yes, delete notification' }).click();
    await this.pages.page.getByText('The notification has been deleted.').waitFor(pageLoadWait);
  }
}

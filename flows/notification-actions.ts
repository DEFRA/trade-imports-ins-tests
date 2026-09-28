import { pageLoadWait, timeouts } from '@config/timeouts';
import type { PageObjects } from '@page-objects';

export class NotificationActions {
  constructor(private readonly pages: PageObjects) {}

  async toNotificationView(journeyId: string): Promise<void> {
    await this.pages.notificationView.open(journeyId);
  }

  async amendNotification(journeyId: string): Promise<void> {
    await this.pages.notificationDashboard.open();
    await this.pages.notificationDashboard.searchForReference(journeyId);
    await this.pages.notificationDashboard.amend(journeyId).click();
    await this.pages.overview.heading.waitFor(pageLoadWait);
  }

  /** Copies a notification from its dashboard card, landing on the copy's overview. */
  async copyNotification(journeyId: string): Promise<void> {
    await this.pages.notificationDashboard.open();
    await this.pages.notificationDashboard.searchForReference(journeyId);
    await this.pages.notificationDashboard.copyAsNew(journeyId).click();
    await this.pages.overview.heading.waitFor(pageLoadWait);
  }

  /**
   * Discards an in-progress amendment, restoring the submitted version. Waits on
   * `?cancelled=1` rather than the view's heading, which the error page also has.
   */
  async cancelAmend(journeyId: string): Promise<void> {
    await this.toNotificationView(journeyId);
    await this.pages.notificationView.cancelAmendment.click();
    await this.pages.notificationCancelAmend.heading.waitFor(pageLoadWait);
    await this.pages.notificationCancelAmend.confirm.click();
    await this.pages.page.waitForURL(/\/notification-view\?cancelled=1$/, { timeout: timeouts.medium });
  }

  async deleteNotification(journeyId: string): Promise<void> {
    await this.pages.notificationDashboard.open();
    await this.pages.notificationDashboard.searchFor(journeyId);
    await this.pages.notificationDashboard.delete(journeyId).click();
    await this.pages.page.getByRole('heading', { name: 'Delete this notification?' }).waitFor(pageLoadWait);
    await this.pages.page.getByRole('button', { name: 'Yes, delete notification' }).click();
    await this.pages.page.getByText('The notification has been deleted.').waitFor(pageLoadWait);
  }
}

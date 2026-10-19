import { pageLoadWait, timeouts } from '@config/timeouts';
import type { PlantsPages, SharedPages } from '@page-objects';

export class PlantsNotificationActions {
  constructor(
    private readonly plantsPages: PlantsPages,
    private readonly pages: SharedPages,
  ) {}

  async toNotificationView(journeyId: string): Promise<void> {
    await this.plantsPages.notificationView.open(journeyId);
  }

  async amendNotification(journeyId: string): Promise<void> {
    await this.plantsPages.dashboard.open();
    await this.plantsPages.dashboard.searchForReference(journeyId);
    await this.plantsPages.dashboard.amend(journeyId).click();
    await this.plantsPages.overview.heading.waitFor(pageLoadWait);
  }

  /**
   * Discards an in-progress amendment, restoring the submitted version. Waits on
   * `?cancelled=1` rather than the view's heading, which the error page also has.
   */
  async cancelAmend(journeyId: string): Promise<void> {
    await this.toNotificationView(journeyId);
    await this.plantsPages.notificationView.cancelAmend.click();
    await this.plantsPages.notificationCancelAmend.heading.waitFor(pageLoadWait);
    await this.plantsPages.notificationCancelAmend.confirm.click();
    await this.pages.page.waitForURL(/\/notification-view\?cancelled=1$/, { timeout: timeouts.medium });
  }
}

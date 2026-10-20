import { pageLoadWait, timeouts } from '@config/timeouts';
import type { CountryCode } from '@domain/animals/constants/country-codes';
import type { AnimalsPages, SharedPages } from '@page-objects';

export class AnimalsNotificationActions {
  constructor(
    private readonly animalsPages: AnimalsPages,
    private readonly pages: SharedPages,
  ) {}

  async toNotificationView(journeyId: string): Promise<void> {
    await this.animalsPages.notificationView.open(journeyId);
  }

  async amendNotification(journeyId: string): Promise<void> {
    await this.animalsPages.dashboard.open();
    await this.animalsPages.dashboard.searchForReference(journeyId);
    await this.animalsPages.dashboard.amend(journeyId).click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
  }

  /** Amends a submitted notification's country of origin and resubmits it, landing on the submitted confirmation. */
  async amendCountryOfOriginAndResubmit(journeyId: string, country: CountryCode): Promise<void> {
    await this.amendNotification(journeyId);
    await this.animalsPages.overview.reviewAndSubmitButton.click();
    await this.animalsPages.notificationView.changeLink('Change import details').click();
    await this.animalsPages.originOfImport.heading.waitFor(pageLoadWait);
    await this.animalsPages.originOfImport.selectCountry(country.display);
    await this.animalsPages.originOfImport.saveAndReturn.click();
    await this.animalsPages.notificationView.continueButton.click();
    await this.animalsPages.declaration.heading.waitFor(pageLoadWait);
    await this.animalsPages.declaration.confirmation.check();
    await this.animalsPages.declaration.continueButton.click();
    await this.pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor(pageLoadWait);
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

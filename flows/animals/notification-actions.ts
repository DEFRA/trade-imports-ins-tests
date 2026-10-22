import { pageLoadWait, timeouts } from '@config/timeouts';
import type { CountryCode } from '@domain/animals/constants/country-codes';
import type { JourneyContext } from '@flows/shared/journey-context';
import type { AnimalsPages, SharedPages } from '@page-objects';

export class AnimalsNotificationActions {
  constructor(
    private readonly animalsPages: AnimalsPages,
    private readonly pages: SharedPages,
    private readonly context: JourneyContext,
  ) {}

  async toNotificationView(referenceNumber: string): Promise<void> {
    await this.animalsPages.notificationView.open(referenceNumber);
  }

  /** From the notification view, changes the country of origin and returns to the view. */
  async changeCountryOfOrigin(country: string): Promise<void> {
    await this.animalsPages.notificationView.changeLink('Change import details').click();
    await this.animalsPages.originOfImport.heading.waitFor(pageLoadWait);
    await this.animalsPages.originOfImport.country.choose(country);
    await this.animalsPages.originOfImport.saveAndReturn.click();
    await this.animalsPages.notificationView.heading.waitFor(pageLoadWait);
  }

  async amendNotification(referenceNumber: string): Promise<void> {
    await this.animalsPages.dashboard.open();
    await this.animalsPages.dashboard.searchForReference(referenceNumber);
    await this.animalsPages.dashboard.amend(referenceNumber).click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
  }

  /** Amends a submitted notification's country of origin and resubmits it, landing on the submitted confirmation. */
  async amendCountryOfOriginAndResubmit(referenceNumber: string, country: CountryCode): Promise<void> {
    await this.amendNotification(referenceNumber);
    await this.animalsPages.overview.reviewAndSubmitButton.click();
    await this.changeCountryOfOrigin(country.display);
    await this.animalsPages.notificationView.continueButton.click();
    await this.animalsPages.declaration.heading.waitFor(pageLoadWait);
    await this.animalsPages.declaration.confirmation.check();
    await this.animalsPages.declaration.continueButton.click();
    await this.pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor(pageLoadWait);
  }

  /** Copies a notification from its dashboard card, landing on the copy's overview. */
  async copyNotification(referenceNumber: string): Promise<void> {
    await this.animalsPages.dashboard.open();
    await this.animalsPages.dashboard.searchForReference(referenceNumber);
    await this.animalsPages.dashboard.copyAsNew(referenceNumber).click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    this.context.recordReferenceNumber(this.animalsPages.overview.referenceNumberFromUrl());
  }

  /**
   * Discards an in-progress amendment, restoring the submitted version. Waits on
   * `?cancelled=1` rather than the view's heading, which the error page also has.
   */
  async cancelAmend(referenceNumber: string): Promise<void> {
    await this.toNotificationView(referenceNumber);
    await this.animalsPages.notificationView.cancelAmend.click();
    await this.animalsPages.notificationCancelAmend.heading.waitFor(pageLoadWait);
    await this.animalsPages.notificationCancelAmend.confirm.click();
    await this.pages.page.waitForURL(/\/notification-view\?cancelled=1$/, { timeout: timeouts.medium });
  }

  async deleteNotification(referenceNumber: string): Promise<void> {
    await this.animalsPages.dashboard.open();
    await this.animalsPages.dashboard.searchFor(referenceNumber);
    await this.animalsPages.dashboard.delete(referenceNumber).click();
    await this.pages.page.getByRole('heading', { name: 'Delete this notification?' }).waitFor(pageLoadWait);
    await this.pages.page.getByRole('button', { name: 'Yes, delete notification' }).click();
    await this.pages.page.getByText('The notification has been deleted.').waitFor(pageLoadWait);
  }
}

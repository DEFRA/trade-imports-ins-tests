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

  /** From the notification view, changes the country of origin, saves it and opens the notification view again. */
  async changeCountryOfOrigin(country: string): Promise<void> {
    await this.animalsPages.notificationView.changeLink('Change origin of import').click();
    await this.animalsPages.originOfImport.heading.waitFor(pageLoadWait);
    const referenceNumber = this.animalsPages.originOfImport.referenceNumberFromUrl();
    await this.animalsPages.originOfImport.country.choose(country);
    await this.animalsPages.originOfImport.saveAndContinue.click();
    await this.animalsPages.commoditySelection.heading.waitFor(pageLoadWait);
    await this.animalsPages.notificationView.open(referenceNumber);
    await this.animalsPages.notificationView.anyReviewHeading.waitFor(pageLoadWait);
  }

  /** Changes the internal reference of an amending notification, saves it and opens the review. */
  async changeInternalReferenceOnAmendment(referenceNumber: string, internalReference: string): Promise<void> {
    await this.animalsPages.originOfImport.open(referenceNumber);
    await this.animalsPages.originOfImport.internalReference.fill(internalReference);
    await this.animalsPages.originOfImport.saveAndContinue.click();
    await this.animalsPages.commoditySelection.heading.waitFor(pageLoadWait);
    await this.animalsPages.notificationView.open(referenceNumber);
  }

  async amendNotification(referenceNumber: string): Promise<void> {
    await this.animalsPages.dashboard.open();
    await this.animalsPages.dashboard.searchForReference(referenceNumber);
    await this.animalsPages.dashboard.amend(referenceNumber).click();
    await this.animalsPages.notificationView.heading.waitFor(pageLoadWait);
  }

  /** Amends a submitted notification's country of origin and resubmits it, landing on the submitted confirmation. */
  async amendCountryOfOriginAndResubmit(referenceNumber: string, country: CountryCode): Promise<void> {
    await this.amendNotification(referenceNumber);
    await this.changeCountryOfOrigin(country.display);
    await this.animalsPages.notificationView.continueButton.click();
    await this.animalsPages.declaration.heading.waitFor(pageLoadWait);
    await this.animalsPages.declaration.confirmation.check();
    await this.animalsPages.declaration.continueButton.click();
    await this.animalsPages.confirmation.heading.waitFor(pageLoadWait);
  }

  /** Copies a notification from its dashboard card, landing on the copy's overview. */
  async copyNotification(referenceNumber: string): Promise<void> {
    await this.animalsPages.dashboard.open();
    await this.animalsPages.dashboard.searchForReference(referenceNumber);
    await this.animalsPages.dashboard.copyAsNew(referenceNumber).click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    this.context.recordReferenceNumber(this.animalsPages.overview.referenceNumberFromUrl());
  }

  async cancelAmend(referenceNumber: string): Promise<void> {
    await this.toNotificationView(referenceNumber);
    await this.animalsPages.notificationView.btnCancelAmend.click();
    await this.animalsPages.notificationCancelAmend.heading.waitFor(pageLoadWait);
    await this.animalsPages.notificationCancelAmend.confirm.click();
    await this.pages.page.waitForURL(/\/notification-view\?cancelled=1$/, { timeout: timeouts.medium });
  }

  async deleteNotification(referenceNumber: string): Promise<void> {
    await this.animalsPages.dashboard.open();
    await this.animalsPages.dashboard.searchFor(referenceNumber);
    await this.animalsPages.dashboard.delete(referenceNumber).click();
    await this.animalsPages.deleteNotification.heading.waitFor(pageLoadWait);
    await this.animalsPages.deleteNotification.confirmDelete.click();
    await this.animalsPages.dashboard.deletedBanner.waitFor(pageLoadWait);
  }
}

import type { Locator } from '@playwright/test';
import { pageLoadWait } from '@config/timeouts';
import type { FrontendFormClient } from '@adapters/http/frontend-form-client';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { PARTY_NAMES, declarationStep, seedSteps, type PartyIds, type PartyRole, type SeedDepth } from '@domain/fixtures/seeded-journey';
import type { JourneyContext } from '@flows/journey';
import { SET_BASES } from '@page-objects/base/sets';

export const CREATE_PATH = `${SET_BASES.liveAnimals}/notifications`;
const CREATED_AT_ORIGIN = new RegExp(`^${CREATE_PATH}/(?<journeyId>[^/]+)/origin$`);

/**
 * Seeds through the frontend's save-and-continue routes, never the backend: only the frontend
 * writes the notification document alongside the fulfilments blob. One post per page, because a
 * save replaces the whole record but a route accepts only its own page's fields.
 */
export class SeededJourney {
  private parties: PartyIds | undefined;

  constructor(
    private readonly forms: FrontendFormClient,
    private readonly addressBook: AddressBookApiClient,
    private readonly context: JourneyContext,
  ) {}

  async createEmptyNotification(): Promise<string> {
    const location = await this.forms.postForm(CREATE_PATH);
    const journeyId = CREATED_AT_ORIGIN.exec(location)?.groups?.journeyId;
    if (!journeyId) {
      throw new Error(`POST ${CREATE_PATH} redirected to "${location}", which is not a new notification's origin page.`);
    }
    return this.remember(journeyId);
  }

  async createDraftNotification(depth: SeedDepth = 'readyToSubmit'): Promise<string> {
    const journeyId = await this.createEmptyNotification();
    for (const { slug, form } of await seedSteps(() => this.partyIds(), depth)) {
      await this.forms.postForm(`${CREATE_PATH}/${journeyId}/${slug}`, form);
    }
    return journeyId;
  }

  async createSubmittedNotification(): Promise<string> {
    const journeyId = await this.createDraftNotification('readyToSubmit');
    // redirectsTo is the assertion: a refused submission lands back on check-your-answers, not the confirmation.
    await this.forms.postForm(`${CREATE_PATH}/${journeyId}/${declarationStep.slug}`, declarationStep.form, {
      redirectsTo: /\/confirmation$/,
    });
    return journeyId;
  }

  async createAmendNotification(): Promise<string> {
    const journeyId = await this.createSubmittedNotification();
    await this.amend(journeyId);
    return journeyId;
  }

  async amend(journeyId: string): Promise<void> {
    await this.forms.postForm(`${CREATE_PATH}/${journeyId}/amend`, {}, { redirectsTo: new RegExp(`^${CREATE_PATH}/${journeyId}$`) });
  }

  async cancelAmend(journeyId: string): Promise<void> {
    await this.forms.postForm(`${CREATE_PATH}/${journeyId}/cancel-amend`, {}, { redirectsTo: /\/notification-view\?cancelled=1$/ });
  }

  async softDelete(journeyId: string): Promise<void> {
    await this.forms.postForm(`${CREATE_PATH}/${journeyId}/delete`, {}, { redirectsTo: /\?deleted=1$/ });
  }

  async resumeInUi<T extends { open(journeyId: string): Promise<void>; heading: Locator }>(journeyId: string, targetPage: T): Promise<T> {
    await targetPage.open(journeyId);
    await targetPage.heading.waitFor(pageLoadWait);
    return targetPage;
  }

  private async partyIds(): Promise<PartyIds> {
    if (this.parties) return this.parties;
    const roles = Object.keys(PARTY_NAMES) as PartyRole[];
    const found = await Promise.all(roles.map((role) => this.addressBook.findByName(PARTY_NAMES[role])));
    this.parties = Object.fromEntries(roles.map((role, index) => [role, found[index].id])) as PartyIds;
    return this.parties;
  }

  private remember(journeyId: string): string {
    this.context.journeyId = journeyId;
    this.context.referenceNumber = journeyId;
    return journeyId;
  }
}

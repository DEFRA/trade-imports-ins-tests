import { CONSIGNMENT_ADDRESSES_CHANGE_LINK } from '@domain/animals/constants/consignment-addresses-page';
import type { Locator } from '@playwright/test';
import type { AnimalsPages } from '@page-objects';
import type { PartyRole as AddressesPartyRole } from '@page-objects/animals/addresses-page';
import type { AnimalsPartyPickerPage } from '@page-objects/animals/party-picker-page';
import { pageLoadWait } from '@config/timeouts';
import type { FrontendFormClient } from '@adapters/http/frontend-form-client';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import {
  declarationStep,
  seedSteps,
  type DraftStage,
  type PartyIds,
  type PartyNames,
  type PartyRole,
  type SeedOptions,
  type SeedStep,
} from '@flows/animals/seed-form-steps';
import { ITAHC_DOCUMENT, MANDATORY_ANSWERS, type NotificationAnswers } from '@domain/animals/constants/journey-options';
import type { JourneyContext } from '@flows/shared/journey-context';
import { SET_BASES } from '@page-objects/shared/sets';
import { OPTIONAL_RETURN_AND_TRAIL_PATTERN } from '@page-objects/shared/base-page';

export const CREATE_PATH = `${SET_BASES.liveAnimals}/notifications`;
export const CREATED_AT_ORIGIN = new RegExp(`^${CREATE_PATH}/(?<referenceNumber>[^/?]+)/origin${OPTIONAL_RETURN_AND_TRAIL_PATTERN}$`);
const CONCURRENCY_TOKEN_FIELD = /name="concurrencyToken" value="(?<token>[^"]+)"/;

const concurrencyTokenIn = (html: string, slug: string): string => {
  const token = CONCURRENCY_TOKEN_FIELD.exec(html)?.groups?.token;
  if (!token) {
    throw new Error(`The ${slug} page rendered no concurrencyToken field, so there is nothing to declare against.`);
  }
  return token;
};

export class AnimalsSeededJourney {
  private readonly partyIdByName = new Map<string, string>();

  constructor(
    private readonly forms: FrontendFormClient,
    private readonly addressBook: AddressBookApiClient,
    private readonly context: JourneyContext,
  ) {}

  async createEmptyNotification(): Promise<string> {
    const location = await this.forms.postForm(CREATE_PATH);
    const referenceNumber = CREATED_AT_ORIGIN.exec(location)?.groups?.referenceNumber;
    if (!referenceNumber) {
      throw new Error(`POST ${CREATE_PATH} redirected to "${location}", which is not a new notification's origin page.`);
    }
    return this.remember(referenceNumber);
  }

  async createDraftNotification(
    stage: DraftStage = 'ready',
    answers: NotificationAnswers = MANDATORY_ANSWERS,
    seedOptions: SeedOptions = {},
  ): Promise<string> {
    const referenceNumber = await this.createEmptyNotification();
    for (const step of await seedSteps((names) => this.partyIds(names), stage, answers, seedOptions)) {
      await this.postSeedStep(`${CREATE_PATH}/${referenceNumber}/${step.slug}`, step);
    }
    return referenceNumber;
  }

  private async postSeedStep(path: string, { form, returnsHtml }: SeedStep): Promise<void> {
    if (returnsHtml) {
      await this.forms.postFormReturningHtml(path, form);
    } else {
      await this.forms.postForm(path, form);
    }
  }

  async createSubmittedNotification(answers: NotificationAnswers = MANDATORY_ANSWERS): Promise<string> {
    const referenceNumber = await this.createDraftNotification('ready', answers);
    await this.declare(referenceNumber);
    return referenceNumber;
  }

  async createSubmittedWithItahcUploadedInUi(
    animalsPages: AnimalsPages,
    answers: NotificationAnswers = MANDATORY_ANSWERS,
  ): Promise<string> {
    const referenceNumber = await this.createDraftNotification('ready', answers);
    await this.resumeInUi(referenceNumber, animalsPages.accompanyingDocuments);
    await animalsPages.accompanyingDocuments.uploadDocumentAndWaitForScan(ITAHC_DOCUMENT);
    await this.declare(referenceNumber);
    return referenceNumber;
  }

  async postDeclarationOfUnfinishedDraft(referenceNumber: string): Promise<void> {
    await this.forms.postForm(
      `${CREATE_PATH}/${referenceNumber}/${declarationStep.slug}`,
      { ...declarationStep.declare, concurrencyToken: await this.reviewConcurrencyToken(referenceNumber) },
      { redirectsTo: /\/notification-view\?refused=1$/ },
    );
  }

  private async reviewConcurrencyToken(referenceNumber: string): Promise<string> {
    const review = await this.forms.getPageHtml(`${CREATE_PATH}/${referenceNumber}/${declarationStep.reviewSlug}`);
    return concurrencyTokenIn(review, declarationStep.reviewSlug);
  }

  private async declare(referenceNumber: string): Promise<void> {
    const declarationPath = `${CREATE_PATH}/${referenceNumber}/${declarationStep.slug}`;
    const concurrencyToken = await this.reviewConcurrencyToken(referenceNumber);
    const declaration = await this.forms.postFormReturningHtml(declarationPath, { ...declarationStep.review, concurrencyToken });
    await this.forms.postForm(
      declarationPath,
      { ...declarationStep.declare, concurrencyToken: concurrencyTokenIn(declaration, declarationStep.slug) },
      { redirectsTo: /\/confirmation$/ },
    );
  }

  async createAmendNotification(answers: NotificationAnswers = MANDATORY_ANSWERS): Promise<string> {
    const referenceNumber = await this.createSubmittedNotification(answers);
    await this.amend(referenceNumber);
    return referenceNumber;
  }

  async amend(referenceNumber: string): Promise<void> {
    await this.forms.postForm(
      `${CREATE_PATH}/${referenceNumber}/amend`,
      {},
      { redirectsTo: new RegExp(`^${CREATE_PATH}/${referenceNumber}/notification-view${OPTIONAL_RETURN_AND_TRAIL_PATTERN}$`) },
    );
  }

  async cancelAmend(referenceNumber: string): Promise<void> {
    await this.forms.postForm(`${CREATE_PATH}/${referenceNumber}/cancel-amend`, {}, { redirectsTo: /\/notification-view\?cancelled=1$/ });
  }

  async softDelete(referenceNumber: string): Promise<void> {
    await this.forms.postForm(`${CREATE_PATH}/${referenceNumber}/delete`, {}, { redirectsTo: /\?deleted=1$/ });
  }

  async resumeInUi<T extends { open(referenceNumber: string): Promise<void>; heading: Locator }>(
    referenceNumber: string,
    targetPage: T,
  ): Promise<T>;
  async resumeInUi<T extends { open(referenceNumber: string): Promise<void> }>(
    referenceNumber: string,
    targetPage: T,
    options: { waitFor: Locator },
  ): Promise<T>;
  async resumeInUi<T extends { open(referenceNumber: string): Promise<void>; heading?: Locator }>(
    referenceNumber: string,
    targetPage: T,
    { waitFor = targetPage.heading }: { waitFor?: Locator } = {},
  ): Promise<T> {
    await targetPage.open(referenceNumber);
    await waitFor?.waitFor(pageLoadWait);
    return targetPage;
  }

  async createDraftAtReviewInUi(animalsPages: AnimalsPages): Promise<string> {
    const referenceNumber = await this.createDraftNotification();
    await this.resumeInUi(referenceNumber, animalsPages.notificationView, { waitFor: animalsPages.notificationView.viewHeader.reference });
    return referenceNumber;
  }

  async createDraftWithConsignorChosenInUi(animalsPages: AnimalsPages, consignorName: string): Promise<string> {
    const referenceNumber = await this.createDraftNotification();
    await this.resumeInUi(referenceNumber, animalsPages.addresses);
    await this.choosePartyInUi(animalsPages, 'Consignor', animalsPages.consignorSelection, consignorName);
    return referenceNumber;
  }

  async createSubmittedWithPlaceOfOriginChosenInUi(animalsPages: AnimalsPages, placeOfOriginName: string): Promise<string> {
    const referenceNumber = await this.createDraftAtReviewInUi(animalsPages);
    await animalsPages.notificationView.changeLink(CONSIGNMENT_ADDRESSES_CHANGE_LINK).click();
    await animalsPages.addresses.heading.waitFor(pageLoadWait);
    await this.choosePartyInUi(animalsPages, 'Place of origin', animalsPages.placeOfOriginSelection, placeOfOriginName);
    await animalsPages.addresses.continueButton.click();
    await animalsPages.contactAddress.heading.waitFor(pageLoadWait);
    await animalsPages.contactAddress.saveAndContinue.click();
    await animalsPages.notificationView.viewHeader.reference.waitFor(pageLoadWait);
    await animalsPages.notificationView.continueButton.click();
    await animalsPages.declaration.heading.waitFor(pageLoadWait);
    await animalsPages.declaration.confirmation.check();
    await animalsPages.declaration.continueButton.click();
    await animalsPages.confirmation.heading.waitFor(pageLoadWait);
    return referenceNumber;
  }

  private async choosePartyInUi(
    animalsPages: AnimalsPages,
    role: AddressesPartyRole,
    picker: AnimalsPartyPickerPage,
    name: string,
  ): Promise<void> {
    await animalsPages.addresses.changeParty(role).click();
    await picker.select(name);
    await picker.saveAndContinue.click();
    await animalsPages.addresses.heading.waitFor(pageLoadWait);
  }

  private async partyIds(names: PartyNames): Promise<PartyIds> {
    const roles = Object.keys(names) as PartyRole[];
    const ids = await Promise.all(roles.map((role) => this.partyIdFor(names[role])));
    return Object.fromEntries(roles.map((role, index) => [role, ids[index]])) as PartyIds;
  }

  private async partyIdFor(name: string): Promise<string> {
    const known = this.partyIdByName.get(name);
    if (known) return known;
    const { id } = await this.addressBook.findByName(name);
    this.partyIdByName.set(name, id);
    return id;
  }

  private remember(referenceNumber: string): string {
    this.context.recordReferenceNumber(referenceNumber);
    return referenceNumber;
  }
}

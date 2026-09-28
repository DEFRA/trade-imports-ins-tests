import { pageLoadWait } from '@config/timeouts';
import type { PageObjects } from '@page-objects';
import type { JourneyOptions } from '@domain/constants/journey-options';
import { getRelativeAppDateText } from '@utils/date-utils';

export type JourneyContext = {
  journeyId?: string;
  referenceNumber?: string;
  declarationDate?: string;
};

const COUNTRY = 'France';
const PORT = 'Aberdeen Harbour (GB ABD)';
// Inside the arrival-date window (1 week back to 6 months ahead) wherever the
// wall clock happens to be, in the unpadded d/m/yyyy the app itself renders —
// so a CYA assertion compares against the app's shape, not the typed string it
// happens to echo back.
export const ARRIVAL_DATE = getRelativeAppDateText({ monthOffset: 1 });

export class Journey {
  constructor(
    private readonly pages: PageObjects,
    private readonly context: JourneyContext,
  ) {}

  async toSignIn(open: (attemptSignIn: boolean) => Promise<void>): Promise<void> {
    await open(false);
  }

  async toNotificationDashboard(): Promise<void> {
    await this.pages.notificationDashboard.open();
    await this.pages.notificationDashboard.heading.waitFor(pageLoadWait);
  }

  private async createNotificationAtOrigin(): Promise<string> {
    await this.toNotificationDashboard();
    await this.pages.notificationDashboard.btnCreateNewNotification.click();
    await this.pages.originOfImport.heading.waitFor(pageLoadWait);
    const journeyId = this.pages.originOfImport.journeyIdFromUrl();
    this.context.journeyId = journeyId;
    this.context.referenceNumber = journeyId;
    return journeyId;
  }

  // Origin answered — most other tasks are gated behind it, so callers that
  // want a usable task list reach the overview this way, not via startNotificationAtOrigin().
  async startNotification(): Promise<string> {
    const journeyId = await this.createNotificationAtOrigin();
    await this.fillOriginOfImport();
    await this.saveOriginOfImport();
    // Wait for the save to land before navigating away. Opening the overview
    // regardless hides a failed save — the run then dies several steps later on
    // a task stuck at "Not yet started", pointing at the wrong page entirely.
    await this.pages.originOfImport.heading.waitFor({ ...pageLoadWait, state: 'hidden' });
    await this.pages.overview.open(journeyId);
    await this.pages.overview.heading.waitFor(pageLoadWait);
    return journeyId;
  }

  // Origin unanswered — the entry guard is satisfied by the opening-run
  // marker set at creation, not by answering origin itself.
  async startNotificationAtOrigin(): Promise<string> {
    const journeyId = await this.createNotificationAtOrigin();
    await this.pages.overview.open(journeyId);
    await this.pages.overview.heading.waitFor(pageLoadWait);
    return journeyId;
  }

  // Origin unanswered, as a brand-new notification first shows it.
  async toOriginOfImport(): Promise<void> {
    await this.createNotificationAtOrigin();
  }

  async fillOriginOfImport(options: JourneyOptions = {}): Promise<void> {
    await this.pages.originOfImport.selectCountry(COUNTRY);
    const requiresRegionCode = options.requiresRegionCode ?? 'No';
    await this.pages.originOfImport.radioRequiresOriginCode(requiresRegionCode).check();
    if (requiresRegionCode === 'Yes') {
      await this.pages.originOfImport.regionCode.fill('75');
    }
    if (options.internalReference) {
      await this.pages.originOfImport.internalReference.fill(options.internalReference);
    }
  }

  async saveOriginOfImport(): Promise<void> {
    await this.pages.originOfImport.saveAndContinue.click();
  }

  async answerOrigin(options: JourneyOptions = {}): Promise<void> {
    await this.pages.overview.task('Where is this consignment coming from?').click();
    await this.fillOriginOfImport(options);
    await this.saveOriginOfImport();
    await this.pages.overview.heading.waitFor(pageLoadWait);
  }

  async answerCommodity(): Promise<void> {
    await this.pages.overview.task('What are you importing?').click();
    await this.pages.commoditySelection.selectSpecies(['Bos taurus']);
    await this.pages.commoditySelection.saveAndContinue.click();
    await this.pages.consignmentDetails.heading.waitFor(pageLoadWait);
    await this.pages.consignmentDetails.numberOfAnimals.fill('1');
    await this.pages.consignmentDetails.numberOfPackages.fill('5');
    await this.pages.consignmentDetails.saveAndContinue.click();
    await this.pages.overview.heading.waitFor(pageLoadWait);
  }

  async answerAnimalIdentification(): Promise<void> {
    await this.pages.overview.task('Identification details').click();
    await this.pages.animalIdentification.earTag.fill('UK123456789012');
    await this.pages.animalIdentification.saveAndContinue.click();
    await this.pages.overview.heading.waitFor(pageLoadWait);
  }

  async answerReasonAndAdditionalDetails(): Promise<void> {
    await this.pages.overview.task('Main reason for import').click();
    await this.pages.importReason.reason('Internal market').check();
    // The purpose is a conditional reveal under the reason, so both answers go
    // in on the one submit.
    await this.pages.importReason.purpose('Breeding').check();
    await this.pages.importReason.saveAndContinue.click();
    await this.pages.additionalDetails.heading.waitFor(pageLoadWait);
    await this.pages.additionalDetails.certifiedFor('Slaughter').check();
    await this.pages.additionalDetails.containsUnweanedAnimals('No').check();
    await this.pages.additionalDetails.saveAndContinue.click();
    await this.pages.overview.heading.waitFor(pageLoadWait);
  }

  async unlockSections(): Promise<void> {
    await this.answerCommodity();
  }

  async toAccompanyingDocuments(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.pages.overview.task('Upload documents').click();
    await this.pages.accompanyingDocuments.heading.waitFor(pageLoadWait);
  }

  async fillAddressesToCph(): Promise<void> {
    await this.pages.overview.task('Roles and addresses').click();
    const parties = [
      ['Consignor or exporter', 'Astra Rosales', 'consignorSelection'],
      ['Place of destination', 'Tech Imports Ltd', 'destinationSelection'],
      ['Place of origin', 'Origin Farm', 'placeOfOriginSelection'],
      ['Consignee', 'British Livestock Ltd', 'consigneeSelection'],
      ['Importer', 'Import Co UK', 'importerSelection'],
    ] as const;
    for (const [role, name, picker] of parties) {
      await this.pages.addresses.addParty(role).click();
      await this.pages[picker].select(name);
      await this.pages[picker].saveAndContinue.click();
      await this.pages.addresses.heading.waitFor(pageLoadWait);
    }
    await this.pages.addresses.continueButton.click();
    await this.pages.cphNumber.heading.waitFor(pageLoadWait);
  }

  async answerAddresses(): Promise<void> {
    await this.fillAddressesToCph();
    await this.pages.cphNumber.fillCphNumber();
    await this.pages.cphNumber.saveAndContinue.click();
    await this.pages.overview.heading.waitFor(pageLoadWait);
  }

  async fillArrivalDetails(means: string = 'Road Vehicle'): Promise<void> {
    await this.pages.arrivalDetails.fillArrivalDate(ARRIVAL_DATE);
    await this.pages.arrivalDetails.selectPort(PORT);
    await this.pages.arrivalDetails.meansOfTransport.selectOption({ label: means });
    await this.pages.arrivalDetails.transportIdentification.fill('FR-892-LK');
    await this.pages.arrivalDetails.transportDocumentReference.fill('CMR-2026-884721');
  }

  // Re-navigate from the hub to the transporter list page within an already
  // unlocked journey. The page itself saves through unfilled; it is filled
  // because a road vehicle keeps transited countries in scope, which is
  // answered on the way.
  async reachTransporterFromHub(): Promise<void> {
    await this.pages.overview.task('Arrival details').click();
    await this.pages.arrivalDetails.heading.waitFor(pageLoadWait);
    await this.fillArrivalDetails();
    await this.pages.arrivalDetails.saveAndContinue.click();
    await this.pages.transitedCountries.heading.waitFor(pageLoadWait);
    await this.pages.transitedCountries.addCountry('France');
    await this.pages.transitedCountries.saveAndContinue.click();
    await this.pages.transporter.heading.waitFor(pageLoadWait);
  }

  async answerTransport(): Promise<void> {
    await this.pages.overview.task('Arrival details').click();
    await this.fillArrivalDetails();
    await this.pages.arrivalDetails.saveAndContinue.click();
    await this.pages.transitedCountries.heading.waitFor(pageLoadWait);
    await this.pages.transitedCountries.addCountry('France');
    await this.pages.transitedCountries.addCountry('Belgium');
    await this.pages.transitedCountries.saveAndContinue.click();
    await this.pages.transporter.heading.waitFor(pageLoadWait);
    await this.pages.transporter.transporter('García Livestock Transport SL').check();
    await this.pages.transporter.saveAndContinue.click();
    await this.pages.overview.heading.waitFor(pageLoadWait);
  }

  async answerContact(): Promise<void> {
    await this.pages.overview.task('Contact address for this consignment').click();
    await this.pages.contactAddress.address('Animal and Plant Health Agency').check();
    await this.pages.contactAddress.saveAndContinue.click();
    await this.pages.overview.heading.waitFor(pageLoadWait);
  }

  async completeAnswerSections(): Promise<void> {
    await this.answerOrigin({ requiresRegionCode: 'Yes', internalReference: 'Imports456GB' });
    await this.answerCommodity();
    await this.answerAnimalIdentification();
    await this.answerReasonAndAdditionalDetails();
    await this.answerAddresses();
    await this.answerTransport();
    await this.answerContact();
  }

  // Reach helpers — land on a page UNFILLED so a per-page spec can drive it.
  // The commodity section (and everything downstream) is gated behind origin,
  // so any reach past origin runs unlockSections first.
  async toCommoditySelection(): Promise<void> {
    await this.startNotification();
    await this.pages.overview.task('What are you importing?').click();
    await this.pages.commoditySelection.heading.waitFor(pageLoadWait);
  }

  async toConsignmentDetails(): Promise<void> {
    await this.toCommoditySelection();
    await this.pages.commoditySelection.selectSpecies(['Bos taurus']);
    await this.pages.commoditySelection.saveAndContinue.click();
    await this.pages.consignmentDetails.heading.waitFor(pageLoadWait);
  }

  async toAnimalIdentification(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.pages.overview.task('Identification details').click();
    await this.pages.animalIdentification.heading.waitFor(pageLoadWait);
  }

  async toImportReason(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.pages.overview.task('Main reason for import').click();
    await this.pages.importReason.heading.waitFor(pageLoadWait);
  }

  async toAdditionalDetails(): Promise<void> {
    await this.toImportReason();
    await this.pages.importReason.reason('Internal market').check();
    await this.pages.importReason.purpose('Breeding').check();
    await this.pages.importReason.saveAndContinue.click();
    await this.pages.additionalDetails.heading.waitFor(pageLoadWait);
  }

  async toCphNumber(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.fillAddressesToCph();
  }

  async toArrivalDetails(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.pages.overview.task('Arrival details').click();
    await this.pages.arrivalDetails.heading.waitFor(pageLoadWait);
  }

  async toTransitedCountries(): Promise<void> {
    await this.toArrivalDetails();
    await this.fillArrivalDetails();
    await this.pages.arrivalDetails.saveAndContinue.click();
    await this.pages.transitedCountries.heading.waitFor(pageLoadWait);
  }

  async toTransporter(): Promise<void> {
    await this.toTransitedCountries();
    await this.pages.transitedCountries.addCountry('France');
    await this.pages.transitedCountries.saveAndContinue.click();
    await this.pages.transporter.heading.waitFor(pageLoadWait);
  }

  // The commercial arm of the add route: the list first, then the type
  // question, and then the form for a commercial transporter that is not on
  // the list.
  async toCommercialTransporter(): Promise<void> {
    await this.toTransporter();
    await this.pages.transporter.addTransporter.click();
    await this.pages.transporterAdd.heading.waitFor(pageLoadWait);
    await this.pages.transporterAdd.transporterType('Commercial').check();
    await this.pages.transporterAdd.saveAndContinue.click();
    await this.pages.commercialTransporter.heading.waitFor(pageLoadWait);
  }

  // The approved commercial register, which nothing links to now that the add
  // route's commercial arm is the add-commercial form. It is reached by its own
  // URL, through that arm so the transporter type is answered — which is what
  // puts the commercial answer the register writes in scope.
  async toTransporterSelection(): Promise<void> {
    await this.toCommercialTransporter();
    await this.pages.transporterSelection.open(this.pages.commercialTransporter.journeyIdFromUrl());
    await this.pages.transporterSelection.heading.waitFor(pageLoadWait);
  }

  async toContactAddress(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.pages.overview.task('Contact address for this consignment').click();
    await this.pages.contactAddress.heading.waitFor(pageLoadWait);
  }

  async toReview(): Promise<void> {
    if (!this.context.journeyId) await this.startNotification();
    await this.completeAnswerSections();
    await this.pages.overview.reviewAndSubmitButton.click();
    await this.pages.notificationView.heading.waitFor(pageLoadWait);
  }

  async toDeclaration(): Promise<void> {
    await this.startNotification();
    await this.completeAnswerSections();
    await this.pages.overview.reviewAndSubmitButton.click();
    await this.pages.notificationView.heading.waitFor(pageLoadWait);
    await this.pages.notificationView.continueButton.click();
    await this.pages.declaration.heading.waitFor(pageLoadWait);
  }

  async submitNotification(): Promise<void> {
    await this.toDeclaration();
    await this.pages.declaration.confirmation.check();
    await this.pages.declaration.continueButton.click();
    await this.pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor(pageLoadWait);
  }
}

import { pageLoadWait } from '@config/timeouts';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import type { AnimalsPages, SharedPages } from '@page-objects';
import type { JourneyOptions } from '@domain/animals/constants/journey-options';
import { getRelativeAppDateText } from '@utils/date-utils';
import type { JourneyContext } from '@flows/shared/journey-context';
import { countryCodes } from '@domain/animals/constants/country-codes';

export type AccompanyingDocumentAnswer = {
  reference: string;
  /** As typed into the date field, d/m/yyyy. */
  issueDate: string;
  filePath: string;
  /** The document-type code the select submits, e.g. VETERINARY_HEALTH_CERTIFICATE. */
  type: string;
};

const COUNTRY = 'France';
const PORT = 'Aberdeen Harbour (GB ABD)';
// Inside the arrival-date window (1 week back to 6 months ahead) wherever the
// wall clock happens to be, in the unpadded d/m/yyyy the app itself renders —
// so a CYA assertion compares against the app's shape, not the typed string it
// happens to echo back.
export const ARRIVAL_DATE = getRelativeAppDateText({ monthOffset: 1 });
// After the arrival date, in the app's own d/m/yyyy.
export const TEMPORARY_ADMISSION_EXIT_DATE = getRelativeAppDateText({ monthOffset: 2 });
export const HORSE_TRANSPORT_ID = 'STENA ADVENTURER';
export const HORSE_TRANSPORTER = 'J & G Campbell LTD';

export class AnimalsJourney {
  constructor(
    private readonly animalsPages: AnimalsPages,
    private readonly pages: SharedPages,
    private readonly context: JourneyContext,
  ) {}

  async toSignIn(open: (attemptSignIn: boolean) => Promise<void>): Promise<void> {
    await open(false);
  }

  async toNotificationDashboard(): Promise<void> {
    await this.animalsPages.dashboard.open();
    await this.animalsPages.dashboard.heading.waitFor(pageLoadWait);
  }

  private async createNotificationAtOrigin(): Promise<string> {
    await this.toNotificationDashboard();
    await this.animalsPages.dashboard.btnCreateNewNotification.click();
    await this.animalsPages.originOfImport.heading.waitFor(pageLoadWait);
    const journeyId = this.animalsPages.originOfImport.journeyIdFromUrl();
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
    await this.animalsPages.originOfImport.heading.waitFor({ ...pageLoadWait, state: 'hidden' });
    await this.animalsPages.overview.open(journeyId);
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    return journeyId;
  }

  // Origin unanswered — the entry guard is satisfied by the opening-run
  // marker set at creation, not by answering origin itself.
  async startNotificationAtOrigin(): Promise<string> {
    const journeyId = await this.createNotificationAtOrigin();
    await this.animalsPages.overview.open(journeyId);
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    return journeyId;
  }

  // Origin unanswered, as a brand-new notification first shows it.
  async toOriginOfImport(): Promise<void> {
    await this.createNotificationAtOrigin();
  }

  async fillOriginOfImport(options: JourneyOptions = {}): Promise<void> {
    await this.animalsPages.originOfImport.selectCountry(options.countryCode?.display ?? COUNTRY);
    const requiresRegionCode = options.requiresRegionCode ?? 'No';
    await this.animalsPages.originOfImport.radioRequiresOriginCode(requiresRegionCode).check();
    if (requiresRegionCode === 'Yes') {
      await this.animalsPages.originOfImport.regionCode.fill('75');
    }
    if (options.internalReference) {
      await this.animalsPages.originOfImport.internalReference.fill(options.internalReference);
    }
  }

  async saveOriginOfImport(): Promise<void> {
    await this.animalsPages.originOfImport.saveAndContinue.click();
  }

  async answerOrigin(options: JourneyOptions = {}): Promise<void> {
    await this.animalsPages.overview.task('Where is this consignment coming from?').click();
    await this.fillOriginOfImport(options);
    await this.saveOriginOfImport();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
  }

  async answerCommodity(): Promise<void> {
    await this.animalsPages.overview.task('What are you importing?').click();
    await this.animalsPages.commoditySelection.selectSpecies(['Bos taurus']);
    await this.animalsPages.commoditySelection.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    await this.animalsPages.overview.task('Commodity details').click();
    await this.animalsPages.consignmentDetails.heading.waitFor(pageLoadWait);
    await this.animalsPages.consignmentDetails.numberOfAnimals.fill('1');
    await this.animalsPages.consignmentDetails.numberOfPackages.fill('5');
    await this.animalsPages.consignmentDetails.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
  }

  async answerAnimalIdentification(): Promise<void> {
    await this.animalsPages.overview.task('Identification details').click();
    await this.animalsPages.animalIdentification.earTag.fill('UK123456789012');
    await this.animalsPages.animalIdentification.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
  }

  async answerReasonAndAdditionalDetails(): Promise<void> {
    await this.animalsPages.overview.task('Main reason for import').click();
    await this.animalsPages.importReason.reason('Internal market').check();
    // The purpose is a conditional reveal under the reason, so both answers go
    // in on the one submit.
    await this.animalsPages.importReason.purpose('Breeding').check();
    await this.animalsPages.importReason.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    await this.animalsPages.overview.task('Additional details').click();
    await this.animalsPages.additionalDetails.heading.waitFor(pageLoadWait);
    await this.animalsPages.additionalDetails.certifiedFor('Slaughter').check();
    await this.animalsPages.additionalDetails.containsUnweanedAnimals('No').check();
    await this.animalsPages.additionalDetails.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
  }

  async unlockSections(): Promise<void> {
    await this.answerCommodity();
  }

  async toAccompanyingDocuments(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.animalsPages.overview.task('Upload documents').click();
    await this.animalsPages.accompanyingDocuments.heading.waitFor(pageLoadWait);
  }

  async addFiveParties(): Promise<void> {
    const parties = [
      ['Consignor or exporter', 'Astra Rosales', 'consignorSelection'],
      ['Place of destination', 'Tech Imports Ltd', 'destinationSelection'],
      ['Place of origin', 'Origin Farm', 'placeOfOriginSelection'],
      ['Consignee', 'British Livestock Ltd', 'consigneeSelection'],
      ['Importer', 'Import Co UK', 'importerSelection'],
    ] as const;
    for (const [role, name, picker] of parties) {
      await this.animalsPages.addresses.addParty(role).click();
      await this.animalsPages[picker].select(name);
      await this.animalsPages[picker].saveAndContinue.click();
      await this.animalsPages.addresses.heading.waitFor(pageLoadWait);
    }
  }

  async fillAddressesAndOpenCph(): Promise<void> {
    await this.animalsPages.overview.task('Roles and addresses').click();
    await this.addFiveParties();
    await this.animalsPages.addresses.addCph.click();
    await this.animalsPages.cphNumber.heading.waitFor(pageLoadWait);
  }

  async answerAddresses(): Promise<void> {
    await this.fillAddressesAndOpenCph();
    await this.animalsPages.cphNumber.fillCphNumber();
    await this.animalsPages.cphNumber.saveAndContinue.click();
    await this.animalsPages.addresses.heading.waitFor(pageLoadWait);
    await this.animalsPages.addresses.continueButton.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
  }

  async fillArrivalDetails(means: string = 'Road'): Promise<void> {
    await this.animalsPages.arrivalDetails.fillArrivalDate(ARRIVAL_DATE);
    await this.animalsPages.arrivalDetails.selectPort(PORT);
    await this.animalsPages.arrivalDetails.meansOfTransport.selectOption({ label: means });
    await this.animalsPages.arrivalDetails.transportIdentification.fill('FR-892-LK');
    await this.animalsPages.arrivalDetails.transportDocumentReference.fill('CMR-2026-884721');
  }

  // Re-navigate from the hub to the transporter list page within an already
  // unlocked journey. The page itself saves through unfilled; it is filled
  // because a road vehicle keeps transited countries in scope, which is
  // answered on the way.
  async reachTransporterFromHub(): Promise<void> {
    await this.animalsPages.overview.task('Arrival details').click();
    await this.animalsPages.arrivalDetails.heading.waitFor(pageLoadWait);
    await this.fillArrivalDetails();
    await this.animalsPages.arrivalDetails.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    await this.animalsPages.overview.task('Transit countries').click();
    await this.animalsPages.transitedCountries.heading.waitFor(pageLoadWait);
    await this.animalsPages.transitedCountries.addCountry('France');
    await this.animalsPages.transitedCountries.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    await this.animalsPages.overview.task('Transport details').click();
    await this.animalsPages.transporter.heading.waitFor(pageLoadWait);
  }

  async answerTransport(): Promise<void> {
    await this.animalsPages.overview.task('Arrival details').click();
    await this.fillArrivalDetails();
    await this.animalsPages.arrivalDetails.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    await this.animalsPages.overview.task('Transit countries').click();
    await this.animalsPages.transitedCountries.heading.waitFor(pageLoadWait);
    await this.animalsPages.transitedCountries.addCountry('France');
    await this.animalsPages.transitedCountries.addCountry('Belgium');
    await this.animalsPages.transitedCountries.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    await this.animalsPages.overview.task('Transport details').click();
    await this.animalsPages.transporter.heading.waitFor(pageLoadWait);
    await this.animalsPages.transporter.transporter('García Livestock Transport SL').check();
    await this.animalsPages.transporter.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
  }

  async answerContact(): Promise<void> {
    await this.animalsPages.overview.task('Contact address for this consignment').click();
    await this.animalsPages.contactAddress.address('Animal and Plant Health Agency').check();
    await this.animalsPages.contactAddress.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
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
    await this.animalsPages.overview.task('What are you importing?').click();
    await this.animalsPages.commoditySelection.heading.waitFor(pageLoadWait);
  }

  async toConsignmentDetails(): Promise<void> {
    await this.toCommoditySelection();
    await this.animalsPages.commoditySelection.selectSpecies(['Bos taurus']);
    await this.animalsPages.commoditySelection.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    await this.animalsPages.overview.task('Commodity details').click();
    await this.animalsPages.consignmentDetails.heading.waitFor(pageLoadWait);
  }

  async toAnimalIdentification(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.animalsPages.overview.task('Identification details').click();
    await this.animalsPages.animalIdentification.heading.waitFor(pageLoadWait);
  }

  async toImportReason(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.animalsPages.overview.task('Main reason for import').click();
    await this.animalsPages.importReason.heading.waitFor(pageLoadWait);
  }

  async toAdditionalDetails(): Promise<void> {
    await this.toImportReason();
    await this.animalsPages.importReason.reason('Internal market').check();
    await this.animalsPages.importReason.purpose('Breeding').check();
    await this.animalsPages.importReason.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    await this.animalsPages.overview.task('Additional details').click();
    await this.animalsPages.additionalDetails.heading.waitFor(pageLoadWait);
  }

  async toCphNumber(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.fillAddressesAndOpenCph();
  }

  async toArrivalDetails(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.animalsPages.overview.task('Arrival details').click();
    await this.animalsPages.arrivalDetails.heading.waitFor(pageLoadWait);
  }

  async toTransitedCountries(): Promise<void> {
    await this.toArrivalDetails();
    await this.fillArrivalDetails();
    await this.animalsPages.arrivalDetails.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    await this.animalsPages.overview.task('Transit countries').click();
    await this.animalsPages.transitedCountries.heading.waitFor(pageLoadWait);
  }

  async toTransporter(): Promise<void> {
    await this.toTransitedCountries();
    await this.animalsPages.transitedCountries.addCountry('France');
    await this.animalsPages.transitedCountries.saveAndContinue.click();
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    await this.animalsPages.overview.task('Transport details').click();
    await this.animalsPages.transporter.heading.waitFor(pageLoadWait);
  }

  // The commercial arm of the add route: the list first, then the type
  // question, and then the form for a commercial transporter that is not on
  // the list.
  async toCommercialTransporter(): Promise<void> {
    await this.toTransporter();
    await this.animalsPages.transporter.addTransporter.click();
    await this.animalsPages.transporterAdd.heading.waitFor(pageLoadWait);
    await this.animalsPages.transporterAdd.transporterType('Commercial').check();
    await this.animalsPages.transporterAdd.saveAndContinue.click();
    await this.animalsPages.commercialTransporter.heading.waitFor(pageLoadWait);
  }

  // The approved commercial register, which nothing links to now that the add
  // route's commercial arm is the add-commercial form. It is reached by its own
  // URL, through that arm so the transporter type is answered — which is what
  // puts the commercial answer the register writes in scope.
  async toTransporterSelection(): Promise<void> {
    await this.toCommercialTransporter();
    await this.animalsPages.transporterSelection.open(this.animalsPages.commercialTransporter.journeyIdFromUrl());
    await this.animalsPages.transporterSelection.heading.waitFor(pageLoadWait);
  }

  async toContactAddress(): Promise<void> {
    await this.startNotification();
    await this.unlockSections();
    await this.animalsPages.overview.task('Contact address for this consignment').click();
    await this.animalsPages.contactAddress.heading.waitFor(pageLoadWait);
  }

  async toReview(): Promise<void> {
    if (!this.context.journeyId) await this.startNotification();
    await this.completeAnswerSections();
    await this.animalsPages.overview.reviewAndSubmitButton.click();
    await this.animalsPages.notificationView.heading.waitFor(pageLoadWait);
  }

  async toDeclaration(): Promise<void> {
    await this.startNotification();
    await this.completeAnswerSections();
    await this.fromOverviewToDeclaration();
  }

  async submitNotification(): Promise<void> {
    await this.toDeclaration();
    await this.confirmDeclaration();
  }

  // The same full journey with one accompanying document added, waiting for its
  // virus scan so the submission carries it.
  async submitNotificationWithDocument(document: AccompanyingDocumentAnswer): Promise<void> {
    await this.startNotification();
    await this.completeAnswerSections();
    await this.animalsPages.overview.task('Upload documents').click();
    await this.animalsPages.accompanyingDocuments.heading.waitFor(pageLoadWait);
    await this.animalsPages.accompanyingDocuments.fillDocument(document.reference, document.issueDate, document.filePath, document.type);
    await this.animalsPages.accompanyingDocuments.saveAndAddAnother.click();
    await this.animalsPages.accompanyingDocuments
      .documentRow(document.reference)
      .filter({ hasText: 'Check completed' })
      .waitFor({ state: 'visible', timeout: fileUploadTimeouts.virusScanComplete });
    await this.animalsPages.overview.open(this.animalsPages.accompanyingDocuments.journeyIdFromUrl());
    await this.animalsPages.overview.heading.waitFor(pageLoadWait);
    await this.fromOverviewToDeclaration();
    await this.confirmDeclaration();
  }

  async walkOpeningRunToRolesAndAddressesWithoutCph(): Promise<string> {
    const pages = this.animalsPages;
    const journeyId = await this.createNotificationAtOrigin();

    await this.fillOriginOfImport();
    await this.saveOriginOfImport();

    await pages.commoditySelection.heading.waitFor(pageLoadWait);
    await pages.commoditySelection.selectSpecies(['Bos taurus']);
    await pages.commoditySelection.saveAndContinue.click();

    await pages.importReason.heading.waitFor(pageLoadWait);
    await pages.importReason.saveAndContinue.click();

    await pages.consignmentDetails.heading.waitFor(pageLoadWait);
    await pages.consignmentDetails.numberOfAnimals.fill('1');
    await pages.consignmentDetails.saveAndContinue.click();

    await pages.animalIdentification.heading.waitFor(pageLoadWait);
    await pages.animalIdentification.saveAndContinue.click();

    await pages.additionalDetails.heading.waitFor(pageLoadWait);
    await pages.additionalDetails.saveAndContinue.click();

    await pages.arrivalDetails.heading.waitFor(pageLoadWait);
    await pages.arrivalDetails.saveAndContinue.click();

    await pages.transporter.heading.waitFor(pageLoadWait);
    await pages.transporter.saveAndContinue.click();

    await pages.accompanyingDocuments.heading.waitFor(pageLoadWait);
    await pages.accompanyingDocuments.continueButton.click();

    await pages.addresses.heading.waitFor(pageLoadWait);
    return journeyId;
  }

  async walkOpeningRunCattleByAir(document: AccompanyingDocumentAnswer): Promise<string> {
    const pages = this.animalsPages;
    const journeyId = await this.createNotificationAtOrigin();

    await this.fillOriginOfImport({ requiresRegionCode: 'Yes', internalReference: 'CATTLE-2026-01' });
    await this.saveOriginOfImport();

    await pages.commoditySelection.heading.waitFor(pageLoadWait);
    await pages.commoditySelection.selectSpecies(['Bos taurus']);
    await pages.commoditySelection.saveAndContinue.click();

    await pages.importReason.heading.waitFor(pageLoadWait);
    await pages.importReason.reason('Internal market').check();
    await pages.importReason.purpose('Breeding').check();
    await pages.importReason.saveAndContinue.click();

    await pages.consignmentDetails.heading.waitFor(pageLoadWait);
    await pages.consignmentDetails.numberOfAnimals.fill('2');
    await pages.consignmentDetails.numberOfPackages.fill('1');
    await pages.consignmentDetails.saveAndContinue.click();

    await pages.animalIdentification.heading.waitFor(pageLoadWait);
    await pages.animalIdentification.earTag.fill('UK000000000001');
    await pages.animalIdentification.passportNumber.fill('PASSPORT-0001');
    await pages.animalIdentification.saveAndAddAnother.click();
    await pages.animalIdentification.savedAnimalRow('Bos taurus', 1).waitFor(pageLoadWait);
    await pages.animalIdentification.earTag.fill('UK000000000002');
    await pages.animalIdentification.passportNumber.fill('PASSPORT-0002');
    await pages.animalIdentification.saveAndFinish.click();
    await pages.animalIdentification.savedAnimalRow('Bos taurus', 2).waitFor(pageLoadWait);
    await pages.animalIdentification.saveAndContinue.click();

    await pages.additionalDetails.heading.waitFor(pageLoadWait);
    await pages.additionalDetails.certifiedFor('Further keeping').check();
    await pages.additionalDetails.containsUnweanedAnimals('No').check();
    await pages.additionalDetails.saveAndContinue.click();

    await pages.arrivalDetails.heading.waitFor(pageLoadWait);
    await pages.arrivalDetails.fillArrivalDate(ARRIVAL_DATE);
    await pages.arrivalDetails.selectPort('Heathrow Airport (GB LHR)');
    await pages.arrivalDetails.meansOfTransport.selectOption({ label: 'Air' });
    await pages.arrivalDetails.transportIdentification.fill('BA0117');
    await pages.arrivalDetails.transportDocumentReference.fill('AWB-2026-0001');
    await pages.arrivalDetails.saveAndContinue.click();

    await pages.transporter.heading.waitFor(pageLoadWait);
    await pages.transporter.transporter('García Livestock Transport SL').check();
    await pages.transporter.saveAndContinue.click();

    await pages.accompanyingDocuments.heading.waitFor(pageLoadWait);
    await pages.accompanyingDocuments.fillDocument(document.reference, document.issueDate, document.filePath, document.type);
    await pages.accompanyingDocuments.saveAndAddAnother.click();
    await pages.accompanyingDocuments
      .documentRow(document.reference)
      .filter({ hasText: 'Check completed' })
      .waitFor({ state: 'visible', timeout: fileUploadTimeouts.virusScanComplete });
    await pages.accompanyingDocuments.continueButton.click();

    await pages.addresses.heading.waitFor(pageLoadWait);
    await this.addFiveParties();
    await pages.addresses.addCph.click();
    await pages.cphNumber.heading.waitFor(pageLoadWait);
    await pages.cphNumber.fillCphNumber();
    await pages.cphNumber.saveAndContinue.click();
    await pages.addresses.heading.waitFor(pageLoadWait);
    await pages.addresses.continueButton.click();

    await pages.contactAddress.heading.waitFor(pageLoadWait);
    await pages.contactAddress.address('Animal and Plant Health Agency').check();
    await pages.contactAddress.saveAndContinue.click();

    await pages.notificationView.heading.waitFor(pageLoadWait);
    return journeyId;
  }

  async walkOpeningRunHorseBySea(document: AccompanyingDocumentAnswer): Promise<string> {
    const pages = this.animalsPages;
    const journeyId = await this.createNotificationAtOrigin();

    await this.fillOriginOfImport({ countryCode: countryCodes.eu.ireland });
    await this.saveOriginOfImport();

    await pages.commoditySelection.heading.waitFor(pageLoadWait);
    await pages.commoditySelection.selectSpecies(['Equus caballus']);
    await pages.commoditySelection.saveAndContinue.click();

    await pages.importReason.heading.waitFor(pageLoadWait);
    await pages.importReason.reason('Temporary admission horses').check();
    await pages.importReason.temporaryAdmissionExitDate.fill(TEMPORARY_ADMISSION_EXIT_DATE);
    await pages.importReason.temporaryAdmissionPortOfExit.selectOption('GB HLY');
    await pages.importReason.saveAndContinue.click();

    await pages.consignmentDetails.heading.waitFor(pageLoadWait);
    await pages.consignmentDetails.numberOfAnimals.fill('1');
    await pages.consignmentDetails.numberOfPackages.fill('1');
    await pages.consignmentDetails.saveAndContinue.click();

    await pages.animalIdentification.heading.waitFor(pageLoadWait);
    await pages.animalIdentification.microchip.fill('900123456789012');
    await pages.animalIdentification.passportNumber.fill('IE-EQ-2026-0001');
    await pages.animalIdentification.horseName.fill('Dublin Bay');
    await pages.animalIdentification.saveAndContinue.click();

    await pages.additionalDetails.heading.waitFor(pageLoadWait);
    await pages.additionalDetails.certifiedFor('Registered equine animal').check();
    await pages.additionalDetails.saveAndContinue.click();

    await pages.arrivalDetails.heading.waitFor(pageLoadWait);
    await pages.arrivalDetails.fillArrivalDate(ARRIVAL_DATE);
    await pages.arrivalDetails.selectPort('Holyhead Port (GB HLY)');
    await pages.arrivalDetails.meansOfTransport.selectOption({ label: 'Sea' });
    await pages.arrivalDetails.transportIdentification.fill(HORSE_TRANSPORT_ID);
    await pages.arrivalDetails.transportDocumentReference.fill('BOL-2026-0001');
    await pages.arrivalDetails.saveAndContinue.click();

    await pages.transporter.heading.waitFor(pageLoadWait);
    await pages.transporter.transporter(HORSE_TRANSPORTER).check();
    await pages.transporter.saveAndContinue.click();

    await pages.accompanyingDocuments.heading.waitFor(pageLoadWait);
    await pages.accompanyingDocuments.fillDocument(document.reference, document.issueDate, document.filePath, document.type);
    await pages.accompanyingDocuments.saveAndAddAnother.click();
    await pages.accompanyingDocuments
      .documentRow(document.reference)
      .filter({ hasText: 'Check completed' })
      .waitFor({ state: 'visible', timeout: fileUploadTimeouts.virusScanComplete });
    await pages.accompanyingDocuments.continueButton.click();

    await pages.addresses.heading.waitFor(pageLoadWait);
    await this.addFiveParties();
    await pages.addresses.continueButton.click();

    await pages.contactAddress.heading.waitFor(pageLoadWait);
    await pages.contactAddress.address('Animal and Plant Health Agency').check();
    await pages.contactAddress.saveAndContinue.click();

    await pages.notificationView.heading.waitFor(pageLoadWait);
    return journeyId;
  }

  async submitFromReview(): Promise<void> {
    await this.animalsPages.notificationView.continueButton.click();
    await this.animalsPages.declaration.heading.waitFor(pageLoadWait);
    await this.confirmDeclaration();
  }

  private async fromOverviewToDeclaration(): Promise<void> {
    await this.animalsPages.overview.reviewAndSubmitButton.click();
    await this.animalsPages.notificationView.heading.waitFor(pageLoadWait);
    await this.animalsPages.notificationView.continueButton.click();
    await this.animalsPages.declaration.heading.waitFor(pageLoadWait);
  }

  private async confirmDeclaration(): Promise<void> {
    await this.animalsPages.declaration.confirmation.check();
    await this.animalsPages.declaration.continueButton.click();
    await this.pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor(pageLoadWait);
  }
}

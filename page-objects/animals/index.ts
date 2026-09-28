import { type Page } from '@playwright/test';
import { AnimalsAccompanyingDocumentsPage } from '@page-objects/animals/accompanying-documents-page';
import { AnimalsAdditionalDetailsPage } from '@page-objects/animals/additional-details-page';
import { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';
import { AnimalsAnimalIdentificationPage } from '@page-objects/animals/animal-identification-page';
import { AnimalsArrivalDetailsPage } from '@page-objects/animals/arrival-details-page';
import { AnimalsCommercialTransporterPage } from '@page-objects/animals/commercial-transporter-page';
import { AnimalsCommoditySelectionPage } from '@page-objects/animals/commodity-selection-page';
import { AnimalsConsignmentDetailsPage } from '@page-objects/animals/consignment-details-page';
import { AnimalsContactAddressPage } from '@page-objects/animals/contact-address-page';
import { AnimalsCphNumberPage } from '@page-objects/animals/cph-number-page';
import { AnimalsDashboardPage } from '@page-objects/animals/dashboard-page';
import { AnimalsDeclarationPage } from '@page-objects/animals/declaration-page';
import { AnimalsImportReasonPage } from '@page-objects/animals/import-reason-page';
import { AnimalsNotificationCancelAmendPage } from '@page-objects/animals/notification-cancel-amend-page';
import { AnimalsNotificationViewPage } from '@page-objects/animals/notification-view-page';
import { AnimalsOriginOfImportPage } from '@page-objects/animals/origin-of-import-page';
import { AnimalsOverviewPage } from '@page-objects/animals/overview-page';
import { AnimalsPartyPickerPage } from '@page-objects/animals/party-picker-page';
import { AnimalsPrivateTransporterPage } from '@page-objects/animals/private-transporter-page';
import { AnimalsTransitedCountriesPage } from '@page-objects/animals/transited-countries-page';
import { AnimalsTransporterAddPage } from '@page-objects/animals/transporter-add-page';
import { AnimalsTransporterPage } from '@page-objects/animals/transporter-page';
import { AnimalsTransporterSelectionPage } from '@page-objects/animals/transporter-selection-page';

export function createAnimalsPages(page: Page) {
  return {
    dashboard: new AnimalsDashboardPage(page),
    overview: new AnimalsOverviewPage(page),
    originOfImport: new AnimalsOriginOfImportPage(page),
    commoditySelection: new AnimalsCommoditySelectionPage(page),
    consignmentDetails: new AnimalsConsignmentDetailsPage(page),
    animalIdentification: new AnimalsAnimalIdentificationPage(page),
    importReason: new AnimalsImportReasonPage(page),
    additionalDetails: new AnimalsAdditionalDetailsPage(page),
    accompanyingDocuments: new AnimalsAccompanyingDocumentsPage(page),
    addresses: new AnimalsAddressesPage(page),
    consignorSelection: new AnimalsPartyPickerPage(page, 'consignors/select', 'Consignor or exporter'),
    destinationSelection: new AnimalsPartyPickerPage(page, 'destinations/select', 'Place of destination'),
    placeOfOriginSelection: new AnimalsPartyPickerPage(page, 'place-of-origin/select', 'Place of origin'),
    consigneeSelection: new AnimalsPartyPickerPage(page, 'consignees/select', 'Consignee'),
    importerSelection: new AnimalsPartyPickerPage(page, 'importers/select', 'Importer'),
    cphNumber: new AnimalsCphNumberPage(page),
    arrivalDetails: new AnimalsArrivalDetailsPage(page),
    transitedCountries: new AnimalsTransitedCountriesPage(page),
    transporter: new AnimalsTransporterPage(page),
    transporterAdd: new AnimalsTransporterAddPage(page),
    transporterSelection: new AnimalsTransporterSelectionPage(page),
    commercialTransporter: new AnimalsCommercialTransporterPage(page),
    privateTransporter: new AnimalsPrivateTransporterPage(page),
    contactAddress: new AnimalsContactAddressPage(page),
    notificationView: new AnimalsNotificationViewPage(page),
    declaration: new AnimalsDeclarationPage(page),
    notificationCancelAmend: new AnimalsNotificationCancelAmendPage(page),
  };
}

export type AnimalsPages = ReturnType<typeof createAnimalsPages>;

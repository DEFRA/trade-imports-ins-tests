import { PlantsConfirmationPage } from './plants/plants-confirmation-page';
import { PlantsDeclarationPage } from './plants/plants-declaration-page';
import { PlantsNotificationViewPage } from './plants/plants-notification-view-page';
import { PlantsConsignmentContactSelectPage } from './plants/plants-consignment-contact-select-page';
import { type Page } from '@playwright/test';
import { AccompanyingDocumentsPage } from './notification/accompanying-documents-page';
import { AdditionalDetailsPage } from './notification/additional-details-page';
import { AddressesPage } from './notification/addresses-page';
import { AnimalIdentificationPage } from './notification/animal-identification-page';
import { ArrivalDetailsPage } from './notification/arrival-details-page';
import { CommercialTransporterPage } from './notification/commercial-transporter-page';
import { CommoditySelectionPage } from './notification/commodity-selection-page';
import { ConsignmentDetailsPage } from './notification/consignment-details-page';
import { ContactAddressPage } from './notification/contact-address-page';
import { CphNumberPage } from './notification/cph-number-page';
import { DeclarationPage } from './notification/declaration-page';
import { ImportReasonPage } from './notification/import-reason-page';
import { NotificationCancelAmendPage } from './notification/notification-cancel-amend-page';
import { NotificationDashboardPage } from './notification/notification-dashboard-page';
import { NotificationViewPage } from './notification/notification-view-page';
import { OriginOfImportPage } from './notification/origin-of-import-page';
import { OverviewPage } from './notification/overview-page';
import { PrivateTransporterPage } from './notification/private-transporter-page';
import { PartyPickerPage } from './notification/party-picker-page';
import { TransitedCountriesPage } from './notification/transited-countries-page';
import { TransporterAddPage } from './notification/transporter-add-page';
import { TransporterPage } from './notification/transporter-page';
import { TransporterSelectionPage } from './notification/transporter-selection-page';
import { AdminDashboardPage } from './admin/admin-dashboard-page';
import { AdminDlqEventsPage } from './admin/admin-dlq-events-page';
import { AdminNotificationsPage } from './admin/admin-notifications-page';
import { AdminOutboxEventsPage } from './admin/admin-outbox-events-page';
import { SignInPage } from './auth/sign-in-page';
import { SignOutPage } from './auth/sign-out-page';
import { OrganisationPickerPage } from './auth/organisation-picker-page';
import { InsAddressBookListPage } from './ins/ins-address-book-list-page';
import { InsDashboardPage } from './ins/ins-dashboard-page';
import { InsAddressBookAddPage } from './ins/ins-address-book-add-page';
import { InsAddressBookViewPage } from './ins/ins-address-book-view-page';
import { InsAddressBookEditPage } from './ins/ins-address-book-edit-page';
import { InsAddressBookDeletePage } from './ins/ins-address-book-delete-page';
import { PlantsArrivalDetailsPage } from './plants/plants-arrival-details-page';
import { PlantsArrivalStatusPage } from './plants/plants-arrival-status-page';
import { PlantsCommoditiesPage } from './plants/plants-commodities-page';
import { PlantsCommodityDetailsPage } from './plants/plants-commodity-details-page';
import { PlantsCommodityTypePage } from './plants/plants-commodity-type-page';
import { PlantsIdentificationNumbersPage } from './plants/plants-identification-numbers-page';
import { PlantsConsignorSelectPage } from './plants/plants-consignor-select-page';
import { PlantsDashboardPage } from './plants/plants-dashboard-page';
import { PlantsDeleteNotificationPage } from './plants/plants-delete-notification-page';
import { PlantsOriginPage } from './plants/plants-origin-page';
import { PlantsOverviewPage } from './plants/plants-overview-page';
import { PlantsPlaceOfDestinationPage } from './plants/plants-place-of-destination-page';

export function createPageObjects(page: Page) {
  return {
    page,
    notificationDashboard: new NotificationDashboardPage(page),
    overview: new OverviewPage(page),
    originOfImport: new OriginOfImportPage(page),
    commoditySelection: new CommoditySelectionPage(page),
    consignmentDetails: new ConsignmentDetailsPage(page),
    animalIdentification: new AnimalIdentificationPage(page),
    importReason: new ImportReasonPage(page),
    additionalDetails: new AdditionalDetailsPage(page),
    accompanyingDocuments: new AccompanyingDocumentsPage(page),
    addresses: new AddressesPage(page),
    consignorSelection: new PartyPickerPage(page, 'consignors/select', 'Consignor or exporter'),
    destinationSelection: new PartyPickerPage(page, 'destinations/select', 'Place of destination'),
    placeOfOriginSelection: new PartyPickerPage(page, 'place-of-origin/select', 'Place of origin'),
    consigneeSelection: new PartyPickerPage(page, 'consignees/select', 'Consignee'),
    importerSelection: new PartyPickerPage(page, 'importers/select', 'Importer'),
    cphNumber: new CphNumberPage(page),
    arrivalDetails: new ArrivalDetailsPage(page),
    transitedCountries: new TransitedCountriesPage(page),
    transporter: new TransporterPage(page),
    transporterAdd: new TransporterAddPage(page),
    transporterSelection: new TransporterSelectionPage(page),
    commercialTransporter: new CommercialTransporterPage(page),
    privateTransporter: new PrivateTransporterPage(page),
    contactAddress: new ContactAddressPage(page),
    notificationView: new NotificationViewPage(page),
    declaration: new DeclarationPage(page),
    notificationCancelAmend: new NotificationCancelAmendPage(page),
    signIn: new SignInPage(page),
    signOut: new SignOutPage(page),
    organisationPicker: new OrganisationPickerPage(page),
    adminDashboard: new AdminDashboardPage(page),
    adminDlqEvents: new AdminDlqEventsPage(page),
    adminNotifications: new AdminNotificationsPage(page),
    adminOutboxEvents: new AdminOutboxEventsPage(page),
    insDashboard: new InsDashboardPage(page),
    insAddressBookList: new InsAddressBookListPage(page),
    insAddressBookAdd: new InsAddressBookAddPage(page),
    insAddressBookView: new InsAddressBookViewPage(page),
    insAddressBookEdit: new InsAddressBookEditPage(page),
    insAddressBookDelete: new InsAddressBookDeletePage(page),
    plantsNotificationView: new PlantsNotificationViewPage(page),
    plantsDeclaration: new PlantsDeclarationPage(page),
    plantsConfirmation: new PlantsConfirmationPage(page),
    plantsDashboard: new PlantsDashboardPage(page),
    plantsOverview: new PlantsOverviewPage(page),
    plantsCommodityType: new PlantsCommodityTypePage(page),
    plantsCommodities: new PlantsCommoditiesPage(page),
    plantsCommodityDetails: new PlantsCommodityDetailsPage(page),
    plantsOrigin: new PlantsOriginPage(page),
    plantsArrivalStatus: new PlantsArrivalStatusPage(page),
    plantsArrivalDetails: new PlantsArrivalDetailsPage(page),
    plantsPlaceOfDestination: new PlantsPlaceOfDestinationPage(page),
    plantsConsignorSelect: new PlantsConsignorSelectPage(page),
    plantsConsignmentContactSelect: new PlantsConsignmentContactSelectPage(page),
    plantsIdentificationNumbers: new PlantsIdentificationNumbersPage(page),
    plantsDeleteNotification: new PlantsDeleteNotificationPage(page),
  };
}

export type PageObjects = ReturnType<typeof createPageObjects>;

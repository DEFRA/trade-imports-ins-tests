import { type Page } from '@playwright/test';
import { PlantsArrivalDetailsPage } from '@page-objects/plants/arrival-details-page';
import { PlantsArrivalStatusPage } from '@page-objects/plants/arrival-status-page';
import { PlantsCommoditiesPage } from '@page-objects/plants/commodities-page';
import { PlantsCommodityDetailsPage } from '@page-objects/plants/commodity-details-page';
import { PlantsCommodityTypePage } from '@page-objects/plants/commodity-type-page';
import { PlantsConfirmationPage } from '@page-objects/plants/confirmation-page';
import { PlantsConsignmentContactSelectPage } from '@page-objects/plants/consignment-contact-select-page';
import { PlantsConsignorSelectPage } from '@page-objects/plants/consignor-select-page';
import { PlantsDashboardPage } from '@page-objects/plants/dashboard-page';
import { PlantsDeclarationPage } from '@page-objects/plants/declaration-page';
import { PlantsDeleteNotificationPage } from '@page-objects/plants/delete-notification-page';
import { PlantsIdentificationNumbersPage } from '@page-objects/plants/identification-numbers-page';
import { PlantsNotificationViewPage } from '@page-objects/plants/notification-view-page';
import { PlantsOriginPage } from '@page-objects/plants/origin-page';
import { PlantsOverviewPage } from '@page-objects/plants/overview-page';
import { PlantsPlaceOfDestinationPage } from '@page-objects/plants/place-of-destination-page';
import { PlantsPartyEditPage } from '@page-objects/plants/party-edit-page';

export function createPlantsPages(page: Page) {
  return {
    dashboard: new PlantsDashboardPage(page),
    overview: new PlantsOverviewPage(page),
    commodityType: new PlantsCommodityTypePage(page),
    commodities: new PlantsCommoditiesPage(page),
    commodityDetails: new PlantsCommodityDetailsPage(page),
    origin: new PlantsOriginPage(page),
    arrivalStatus: new PlantsArrivalStatusPage(page),
    arrivalDetails: new PlantsArrivalDetailsPage(page),
    placeOfDestination: new PlantsPlaceOfDestinationPage(page),
    consignorSelect: new PlantsConsignorSelectPage(page),
    consignmentContactSelect: new PlantsConsignmentContactSelectPage(page),
    identificationNumbers: new PlantsIdentificationNumbersPage(page),
    notificationView: new PlantsNotificationViewPage(page),
    declaration: new PlantsDeclarationPage(page),
    confirmation: new PlantsConfirmationPage(page),
    deleteNotification: new PlantsDeleteNotificationPage(page),
    consignorEdit: new PlantsPartyEditPage(page, 'consignors/edit', 'Consignor or exporter'),
    placeOfDestinationEdit: new PlantsPartyEditPage(page, 'destinations/edit', 'Place of destination'),
    contactAddressEdit: new PlantsPartyEditPage(page, 'consignment/contact/edit', 'Contact address'),
  };
}

export type PlantsPages = ReturnType<typeof createPlantsPages>;

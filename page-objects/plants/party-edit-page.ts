import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import { withPartyEditForm } from '@page-objects/shared/party-edit-form';

export class PlantsPartyEditPage extends withPartyEditForm(PlantsNotificationPage) {}

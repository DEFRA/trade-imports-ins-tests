import { NotificationPage } from '@page-objects/shared/base-page';
import { SET_BASES, SetBase } from '@page-objects/shared/sets';

export class PlantsNotificationPage extends NotificationPage {
  protected get setBase(): SetBase {
    return SET_BASES.highRiskPlants;
  }

  protected async navigateToService(path: string): Promise<void> {
    await this.navigateToPlantsFrontend(path);
  }
}

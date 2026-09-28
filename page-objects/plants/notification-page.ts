import { NotificationPage } from '@page-objects/shared/base-page';
import { SET_BASES, SetBase } from '@page-objects/shared/sets';

/**
 * The plants journey's notification pages share the animals URL shape
 * (`/<set-id>/notifications/{journeyId}[/slug]`) but sit on their own frontend
 * and under their own set, so those two facts are all that differ.
 */
export class PlantsNotificationPage extends NotificationPage {
  protected get setBase(): SetBase {
    return SET_BASES.highRiskPlants;
  }

  protected async navigateToService(path: string): Promise<void> {
    await this.navigateToPlantsFrontend(path);
  }
}

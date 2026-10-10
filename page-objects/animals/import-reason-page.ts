import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsImportReasonPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'import-reason');
  }

  // The page is headed with its name; the question it asks stays as the radio
  // group's visually hidden legend, so it is a group name, not a heading.
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Main import reason', exact: true });
  }

  get questionGroup(): Locator {
    return this.page.getByRole('group', { name: 'What is the main reason for importing the animals?' });
  }

  reason(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  purpose(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  // The reveals are addressed by id, not by label: two reasons ask the
  // destination country and two ask the port of exit, so each label is on the
  // page twice and only the id tells the branches apart.
  get transitPortOfExit(): Locator {
    return this.page.locator('#transitPortOfExit');
  }

  // Every port offered, skipping the empty placeholder.
  get transitPortOfExitOptions(): Locator {
    return this.transitPortOfExit.locator('option:not([value=""])');
  }

  // Every option in the list, the placeholder included, in the order it is offered.
  get transitPortOfExitAllOptions(): Locator {
    return this.transitPortOfExit.locator('option');
  }

  get transitDestinationCountry(): Locator {
    return this.page.locator('#transitDestinationCountry');
  }

  // Every option in the list, the placeholder included, in the order it is offered.
  get transitDestinationCountryAllOptions(): Locator {
    return this.transitDestinationCountry.locator('option');
  }

  get transhipmentDestinationCountry(): Locator {
    return this.page.locator('#transhipmentDestinationCountry');
  }

  // Every option in the list, the placeholder included, in the order it is offered.
  get transhipmentDestinationCountryAllOptions(): Locator {
    return this.transhipmentDestinationCountry.locator('option');
  }

  // Every country offered, skipping the empty placeholder.
  get transhipmentDestinationCountryOptions(): Locator {
    return this.transhipmentDestinationCountry.locator('option:not([value=""])');
  }

  // Every country offered, skipping the empty placeholder.
  get transitDestinationCountryOptions(): Locator {
    return this.transitDestinationCountry.locator('option:not([value=""])');
  }

  // A territory is coded by ISO 3166-2, the parent country code and a hyphen; a country's alpha-2 code has none.
  get transhipmentTerritoryOptions(): Locator {
    return this.transhipmentDestinationCountry.locator('option[value*="-"]');
  }

  get temporaryAdmissionPortOfExit(): Locator {
    return this.page.locator('#temporaryAdmissionPortOfExit');
  }

  // Every port offered, skipping the empty placeholder.
  get temporaryAdmissionPortOfExitOptions(): Locator {
    return this.temporaryAdmissionPortOfExit.locator('option:not([value=""])');
  }

  // Every option in the list, the placeholder included, in the order it is offered.
  get temporaryAdmissionPortOfExitAllOptions(): Locator {
    return this.temporaryAdmissionPortOfExit.locator('option');
  }

  get temporaryAdmissionExitDate(): Locator {
    return this.page.locator('#temporaryAdmissionExitDate');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }
}

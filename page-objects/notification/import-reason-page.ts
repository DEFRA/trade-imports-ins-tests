import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class ImportReasonPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'import-reason');
  }

  // The page is headed with its name; the question it asks stays as the radio
  // group's visually hidden legend, so it is a group name, not a heading.
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Main reason for import', exact: true });
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

  get transitDestinationCountry(): Locator {
    return this.page.locator('#transitDestinationCountry');
  }

  get transhipmentDestinationCountry(): Locator {
    return this.page.locator('#transhipmentDestinationCountry');
  }

  get temporaryAdmissionPortOfExit(): Locator {
    return this.page.locator('#temporaryAdmissionPortOfExit');
  }

  get temporaryAdmissionExitDate(): Locator {
    return this.page.locator('#temporaryAdmissionExitDate');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

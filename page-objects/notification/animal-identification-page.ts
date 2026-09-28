import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class AnimalIdentificationPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodities/identification');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Identification details' });
  }

  get earTag(): Locator {
    return this.page.getByLabel('Ear tag', { exact: true });
  }

  get passportNumber(): Locator {
    return this.page.getByLabel('Passport', { exact: true });
  }

  // A saved animal is one row of the card's table, keyed by its species and
  // number — "Bos taurus 1".
  savedAnimalRow(species: string, number: number): Locator {
    return this.page.getByRole('row').filter({ hasText: `${species} ${number}` });
  }

  identifierColumn(name: string): Locator {
    return this.page.getByRole('columnheader', { name, exact: true });
  }

  get saveAndAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Save and add another' });
  }

  // The in-card button names what is left on the line: it finishes the line on
  // the last outstanding animal rather than inviting another.
  get saveAndFinish(): Locator {
    return this.page.getByRole('button', { name: 'Save and finish' });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsAnimalIdentificationPage extends NotificationPage {
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

  get microchip(): Locator {
    return this.page.getByLabel('Microchip number', { exact: true });
  }

  get horseName(): Locator {
    return this.page.getByLabel('Horse name', { exact: true });
  }

  get panelHeadings(): Locator {
    return this.page.getByRole('heading', { level: 3, name: /^Enter details for / });
  }

  savedAnimalRow(species: string, number: number): Locator {
    return this.page.getByRole('row').filter({ hasText: `${species} ${number}` });
  }

  identifierColumn(name: string): Locator {
    return this.page.getByRole('columnheader', { name, exact: true });
  }

  get saveAndAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Save and add another' });
  }

  get saveAndFinish(): Locator {
    return this.page.getByRole('button', { name: 'Save and finish' });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

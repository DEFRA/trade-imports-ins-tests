import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { SelectedCommoditiesTable } from '@page-objects/animals/selected-commodities-table';

export class AnimalsAnimalIdentificationPage extends NotificationPage {
  readonly selectedCommodities = new SelectedCommoditiesTable(this.page);

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
    return this.page.getByLabel('Microchip', { exact: true });
  }

  get horseName(): Locator {
    return this.page.getByLabel('Horse name', { exact: true });
  }

  get speciesCardTitles(): Locator {
    return this.page.getByRole('form').getByRole('region').getByRole('heading', { level: 3 });
  }

  enterDetailsHeadingText(latinName: string, current: number, total: number): string {
    return `Enter details for ${latinName} ${current} of ${total}`;
  }

  enterDetailsCounterHeading(latinName: string, current: number, total: number): Locator {
    return this.page.getByRole('heading', {
      name: this.enterDetailsHeadingText(latinName, current, total),
      exact: true,
    });
  }

  get permanentAddressName(): Locator {
    return this.page.getByLabel('Name or organisation name', { exact: true });
  }

  get permanentAddressLine1(): Locator {
    return this.page.getByLabel('Address line 1', { exact: true });
  }

  get permanentAddressTownOrCity(): Locator {
    return this.page.getByLabel('Town or city', { exact: true });
  }

  get permanentAddressPostcode(): Locator {
    return this.page.getByLabel('Postcode or Zip code', { exact: true });
  }

  get permanentAddressPhone(): Locator {
    return this.page.getByLabel('Phone number', { exact: true });
  }

  get permanentAddressEmail(): Locator {
    return this.page.getByLabel('Email address', { exact: true });
  }

  commodityHeading(heading: string): Locator {
    return this.page.getByRole('heading', { level: 2, name: heading, exact: true });
  }

  speciesCard(latinName: string): Locator {
    return this.page.getByRole('region', { name: latinName, exact: true });
  }

  savedAnimalsRows(latinName: string): Locator {
    return this.speciesCard(latinName).getByRole('table').locator('tbody').getByRole('row');
  }

  savedAnimalRow(latinName: string, number: number): Locator {
    return this.speciesCard(latinName)
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: `${latinName} ${number}`, exact: true }) });
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
}

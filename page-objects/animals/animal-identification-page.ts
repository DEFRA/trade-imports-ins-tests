import { type Locator, type Page } from '@playwright/test';
import { speciesLabel, type CommodityLine } from '@domain/animals/constants/commodity-lines';
import { NotificationPage } from '@page-objects/shared/base-page';
import { SelectedCommoditiesTable } from '@page-objects/animals/selected-commodities-table';

const EAR_TAG_LABEL = 'Ear tag';
const PASSPORT_LABEL = 'Passport';
const MICROCHIP_LABEL = 'Microchip';
const HORSE_NAME_LABEL = 'Horse name';
const TATTOO_LABEL = 'Tattoo';
const IDENTIFICATION_DETAILS_LABEL = 'Identification details';
const DESCRIPTION_LABEL = 'Description';
const SAVE_AND_ADD_ANOTHER = 'Save and add another';
const SAVE_AND_FINISH = 'Save and finish';

export class AnimalsAnimalIdentificationPage extends NotificationPage {
  readonly selectedCommodities = new SelectedCommoditiesTable(this.page);

  constructor(page: Page) {
    super(page, 'commodities/identification');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Identification details' });
  }

  get earTag(): Locator {
    return this.page.getByLabel(EAR_TAG_LABEL, { exact: true });
  }

  get passportNumber(): Locator {
    return this.page.getByLabel(PASSPORT_LABEL, { exact: true });
  }

  get microchip(): Locator {
    return this.page.getByLabel(MICROCHIP_LABEL, { exact: true });
  }

  get horseName(): Locator {
    return this.page.getByLabel(HORSE_NAME_LABEL, { exact: true });
  }

  get tattoo(): Locator {
    return this.page.getByLabel(TATTOO_LABEL, { exact: true });
  }

  get identificationDetails(): Locator {
    return this.page.getByLabel(IDENTIFICATION_DETAILS_LABEL, { exact: true });
  }

  get description(): Locator {
    return this.page.getByLabel(DESCRIPTION_LABEL, { exact: true });
  }

  enterDetailsCounterHeading(species: CommodityLine, current: number, total: number): Locator {
    return this.page.getByRole('heading', {
      name: `Enter details for ${speciesLabel(species)} ${current} of ${total}`,
      exact: true,
    });
  }

  commodityHeading(heading: string): Locator {
    return this.page.getByRole('heading', { level: 2, name: heading, exact: true });
  }

  speciesCard(species: CommodityLine): Locator {
    return this.page.getByRole('region', { name: speciesLabel(species), exact: true });
  }

  savedAnimalsRows(species: CommodityLine): Locator {
    return this.speciesCard(species).getByRole('table').locator('tbody').getByRole('row');
  }

  savedAnimalRow(species: CommodityLine, number: number): Locator {
    return this.speciesCard(species)
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: `${speciesLabel(species)} ${number}`, exact: true }) });
  }

  removeButton(species: CommodityLine, number: number): Locator {
    return this.savedAnimalRow(species, number).getByRole('button', { name: 'Remove' });
  }

  identifierColumn(name: string): Locator {
    return this.page.getByRole('columnheader', { name, exact: true });
  }

  get saveAndAddAnother(): Locator {
    return this.page.getByRole('button', { name: SAVE_AND_ADD_ANOTHER });
  }

  get saveAndFinish(): Locator {
    return this.page.getByRole('button', { name: SAVE_AND_FINISH });
  }

  private cardField(card: Locator, label: string): Locator {
    return card.getByLabel(label, { exact: true });
  }

  cardEarTag(card: Locator): Locator {
    return this.cardField(card, EAR_TAG_LABEL);
  }

  cardPassport(card: Locator): Locator {
    return this.cardField(card, PASSPORT_LABEL);
  }

  cardMicrochip(card: Locator): Locator {
    return this.cardField(card, MICROCHIP_LABEL);
  }

  cardHorseName(card: Locator): Locator {
    return this.cardField(card, HORSE_NAME_LABEL);
  }

  cardTattoo(card: Locator): Locator {
    return this.cardField(card, TATTOO_LABEL);
  }

  cardIdentificationDetails(card: Locator): Locator {
    return this.cardField(card, IDENTIFICATION_DETAILS_LABEL);
  }

  cardDescription(card: Locator): Locator {
    return this.cardField(card, DESCRIPTION_LABEL);
  }

  cardColumnHeadings(card: Locator): Locator {
    return card.getByRole('columnheader');
  }

  cardEntryLabels(card: Locator): Locator {
    return card.locator('label[for$="-0"]');
  }

  cardSaveControl(card: Locator): Locator {
    return card.getByRole('button', { name: SAVE_AND_ADD_ANOTHER }).or(card.getByRole('button', { name: SAVE_AND_FINISH }));
  }
}

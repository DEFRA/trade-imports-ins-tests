import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { DatePicker } from '@page-objects/shared/date-picker';
import { TypeAhead } from '@page-objects/shared/type-ahead';

export class AnimalsImportReasonPage extends NotificationPage {
  readonly transitPortOfExit: TypeAhead;
  readonly transitDestinationCountry: TypeAhead;
  readonly transhipmentDestinationCountry: TypeAhead;
  readonly temporaryAdmissionPortOfExit: TypeAhead;

  constructor(page: Page) {
    super(page, 'import-reason');
    this.transitPortOfExit = new TypeAhead(page, 'transitPortOfExit');
    this.transitDestinationCountry = new TypeAhead(page, 'transitDestinationCountry');
    this.transhipmentDestinationCountry = new TypeAhead(page, 'transhipmentDestinationCountry');
    this.temporaryAdmissionPortOfExit = new TypeAhead(page, 'temporaryAdmissionPortOfExit');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Main import reason', exact: true });
  }

  get mainHeadings(): Locator {
    return this.page.getByRole('main').getByRole('heading');
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

  get transhipmentTerritoryOptions(): Locator {
    return this.transhipmentDestinationCountry.select.locator('option[value*="-"]');
  }

  get temporaryAdmissionExitDate(): Locator {
    return this.page.locator('#temporaryAdmissionExitDate');
  }

  get temporaryAdmissionExitDatePicker(): DatePicker {
    return new DatePicker(this.page, 'temporaryAdmissionExitDate');
  }

  async selectTransitPortOfExitByIndex(index: number): Promise<void> {
    await this.transitPortOfExit.chooseByIndex(index);
  }

  async selectTransitDestinationCountry(value: string): Promise<void> {
    await this.transitDestinationCountry.chooseByValue(value);
  }

  async selectTranshipmentDestinationCountry(value: string): Promise<void> {
    await this.transhipmentDestinationCountry.chooseByValue(value);
  }

  async selectTemporaryAdmissionPortOfExitByIndex(index: number): Promise<void> {
    await this.temporaryAdmissionPortOfExit.chooseByIndex(index);
  }

  async selectTemporaryAdmissionPortOfExit(value: string): Promise<void> {
    await this.temporaryAdmissionPortOfExit.chooseByValue(value);
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }
}

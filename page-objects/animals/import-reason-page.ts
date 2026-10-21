import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { DatePicker } from '@page-objects/shared/date-picker';
import { TypeAhead } from '@page-objects/shared/type-ahead';

export class AnimalsImportReasonPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'import-reason');
  }

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

  get transitPortOfExit(): Locator {
    return this.page.locator('#transitPortOfExit');
  }

  get transitPortOfExitValue(): Locator {
    return this.hiddenSelect('transitPortOfExit');
  }

  get transitPortOfExitOptions(): Locator {
    return this.transitPortOfExitValue.locator('option:not([value=""])');
  }

  get transitDestinationCountry(): Locator {
    return this.page.locator('#transitDestinationCountry');
  }

  get transitDestinationCountryValue(): Locator {
    return this.hiddenSelect('transitDestinationCountry');
  }

  get transitDestinationCountryOptions(): Locator {
    return this.transitDestinationCountryValue.locator('option:not([value=""])');
  }

  get transhipmentDestinationCountry(): Locator {
    return this.page.locator('#transhipmentDestinationCountry');
  }

  get transhipmentDestinationCountryValue(): Locator {
    return this.hiddenSelect('transhipmentDestinationCountry');
  }

  get transhipmentDestinationCountryOptions(): Locator {
    return this.transhipmentDestinationCountryValue.locator('option:not([value=""])');
  }

  get transhipmentTerritoryOptions(): Locator {
    return this.transhipmentDestinationCountryValue.locator('option[value*="-"]');
  }

  get temporaryAdmissionPortOfExit(): Locator {
    return this.page.locator('#temporaryAdmissionPortOfExit');
  }

  get temporaryAdmissionPortOfExitValue(): Locator {
    return this.hiddenSelect('temporaryAdmissionPortOfExit');
  }

  get temporaryAdmissionPortOfExitOptions(): Locator {
    return this.temporaryAdmissionPortOfExitValue.locator('option:not([value=""])');
  }

  get temporaryAdmissionExitDate(): Locator {
    return this.page.locator('#temporaryAdmissionExitDate');
  }

  get temporaryAdmissionExitDatePicker(): DatePicker {
    return new DatePicker(this.page, 'temporaryAdmissionExitDate');
  }

  get temporaryAdmissionPortOfExitLabel(): Locator {
    return this.page.locator('label[for="temporaryAdmissionPortOfExit"]');
  }

  private hiddenSelect(fieldId: string): Locator {
    return this.page.locator(`select#${fieldId}-select`);
  }

  private typeAhead(fieldId: string): TypeAhead {
    return new TypeAhead(this.page, fieldId);
  }

  async selectTransitPortOfExitByIndex(index: number): Promise<void> {
    await this.typeAhead('transitPortOfExit').chooseByIndex(index);
  }

  async selectTransitDestinationCountry(value: string): Promise<void> {
    await this.typeAhead('transitDestinationCountry').chooseByValue(value);
  }

  async selectTranshipmentDestinationCountry(value: string): Promise<void> {
    await this.typeAhead('transhipmentDestinationCountry').chooseByValue(value);
  }

  async selectTemporaryAdmissionPortOfExitByIndex(index: number): Promise<void> {
    await this.typeAhead('temporaryAdmissionPortOfExit').chooseByIndex(index);
  }

  async selectTemporaryAdmissionPortOfExit(value: string): Promise<void> {
    await this.typeAhead('temporaryAdmissionPortOfExit').chooseByValue(value);
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }
}

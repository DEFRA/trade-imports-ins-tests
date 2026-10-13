import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsImportReasonPage extends NotificationPage {
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

  // The hidden select the type-ahead enhances: it carries the option list and
  // the code the form submits.
  get transitPortOfExitValue(): Locator {
    return this.hiddenSelect('transitPortOfExit');
  }

  // Every port offered, skipping the empty placeholder.
  get transitPortOfExitOptions(): Locator {
    return this.transitPortOfExitValue.locator('option:not([value=""])');
  }

  get transitDestinationCountry(): Locator {
    return this.page.locator('#transitDestinationCountry');
  }

  get transitDestinationCountryValue(): Locator {
    return this.hiddenSelect('transitDestinationCountry');
  }

  // Every country offered, skipping the empty placeholder.
  get transitDestinationCountryOptions(): Locator {
    return this.transitDestinationCountryValue.locator('option:not([value=""])');
  }

  get transhipmentDestinationCountry(): Locator {
    return this.page.locator('#transhipmentDestinationCountry');
  }

  get transhipmentDestinationCountryValue(): Locator {
    return this.hiddenSelect('transhipmentDestinationCountry');
  }

  // Every country offered, skipping the empty placeholder.
  get transhipmentDestinationCountryOptions(): Locator {
    return this.transhipmentDestinationCountryValue.locator('option:not([value=""])');
  }

  // A territory is coded by ISO 3166-2, the parent country code and a hyphen; a country's alpha-2 code has none.
  get transhipmentTerritoryOptions(): Locator {
    return this.transhipmentDestinationCountryValue.locator('option[value*="-"]');
  }

  get temporaryAdmissionPortOfExit(): Locator {
    return this.page.locator('#temporaryAdmissionPortOfExit');
  }

  get temporaryAdmissionPortOfExitValue(): Locator {
    return this.hiddenSelect('temporaryAdmissionPortOfExit');
  }

  // Every port offered, skipping the empty placeholder.
  get temporaryAdmissionPortOfExitOptions(): Locator {
    return this.temporaryAdmissionPortOfExitValue.locator('option:not([value=""])');
  }

  get temporaryAdmissionExitDate(): Locator {
    return this.page.locator('#temporaryAdmissionExitDate');
  }

  private hiddenSelect(fieldId: string): Locator {
    return this.page.locator(`select#${fieldId}-select`);
  }

  private listOption(name: string): Locator {
    return this.page.getByRole('option', { name, exact: true });
  }

  // Ports and countries on this page are accessible-autocomplete fields with a
  // native <select> fallback. With JavaScript the enhancement takes the id onto
  // the combobox input and renames the select "{id}-select".
  private async chooseEnhancedSelect(fieldId: string, choice: { index: number } | { value: string }): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    const field = this.page.locator(`#${fieldId}`);
    const hidden = this.hiddenSelect(fieldId);

    if ((await field.evaluate((el) => el.tagName)) === 'SELECT') {
      if ('index' in choice) {
        await field.selectOption({ index: choice.index });
      } else {
        await field.selectOption(choice.value);
      }
      return;
    }

    let label: string;
    if ('index' in choice) {
      label = (await hidden.locator('option').nth(choice.index).textContent())?.trim() ?? '';
    } else {
      label = (await hidden.locator(`option[value="${choice.value}"]`).textContent())?.trim() ?? '';
    }
    if (!label) {
      throw new Error(`No option for ${fieldId}: ${JSON.stringify(choice)}`);
    }

    await field.click();
    await field.fill(label);
    await this.listOption(label).click();
  }

  async selectTransitPortOfExitByIndex(index: number): Promise<void> {
    await this.chooseEnhancedSelect('transitPortOfExit', { index });
  }

  async selectTransitDestinationCountry(value: string): Promise<void> {
    await this.chooseEnhancedSelect('transitDestinationCountry', { value });
  }

  async selectTranshipmentDestinationCountry(value: string): Promise<void> {
    await this.chooseEnhancedSelect('transhipmentDestinationCountry', { value });
  }

  async selectTemporaryAdmissionPortOfExitByIndex(index: number): Promise<void> {
    await this.chooseEnhancedSelect('temporaryAdmissionPortOfExit', { index });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}

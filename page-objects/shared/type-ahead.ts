import { expect, type Locator, type Page } from '@playwright/test';

const SEARCH_BOX_ASSISTIVE_DESCRIPTION =
  'When autocomplete results are available use up and down arrows to review and enter to select. Touch device users, explore by touch or with swipe gestures.';

/**
 * A type-ahead that enhances a native select, addressed by the select's id.
 * With JavaScript the id sits on the search box; without it the select keeps
 * the id and is the control.
 */
export class TypeAhead {
  constructor(
    private readonly page: Page,
    private readonly fieldId: string,
  ) {}

  get field(): Locator {
    return this.page.locator(`#${this.fieldId}`);
  }

  get formGroup(): Locator {
    return this.field.locator('xpath=ancestor::*[contains(@class,"govuk-form-group")][1]');
  }

  async expectNoHint(): Promise<void> {
    const isSearchBox = (await this.field.evaluate((element) => element.tagName)) === 'INPUT';
    await expect(this.field).toHaveAccessibleDescription(isSearchBox ? SEARCH_BOX_ASSISTIVE_DESCRIPTION : '');
    await expect(this.formGroup.locator('.govuk-hint')).toHaveCount(0);
  }

  get select(): Locator {
    return this.page.locator(`select[name="${this.fieldId}"]`);
  }

  get options(): Locator {
    return this.select.locator('option');
  }

  get selectableOptions(): Locator {
    return this.select.locator('option:not([value=""])');
  }

  get suggestions(): Locator {
    return this.page.getByRole('option');
  }

  option(name: string): Locator {
    return this.page.getByRole('option', { name, exact: true });
  }

  boldLettersOf(name: string): Locator {
    return this.option(name).locator('strong');
  }

  async choose(name: string): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    if ((await this.field.evaluate((element) => element.tagName)) === 'SELECT') {
      await this.field.selectOption({ label: name });
      return;
    }
    await this.field.click();
    await this.field.fill(name);
    await this.option(name).click();
  }

  async chooseByIndex(index: number): Promise<void> {
    await this.choose(await this.labelOf(this.options.nth(index), `index ${index}`));
  }

  async chooseByValue(value: string): Promise<void> {
    await this.choose(await this.labelOf(this.select.locator(`option[value="${value}"]`), `value ${value}`));
  }

  private async labelOf(option: Locator, description: string): Promise<string> {
    const label = (await option.textContent())?.trim();
    if (!label) {
      throw new Error(`No option for ${this.fieldId} at ${description}`);
    }
    return label;
  }
}

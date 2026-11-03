import { type Locator, type Page } from '@playwright/test';

/** A type-ahead that enhances a native select, addressed by the select's id. */
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

  get hint(): Locator {
    return this.formGroup.locator('.govuk-hint');
  }

  get searchButton(): Locator {
    return this.field.locator('xpath=ancestor::*[contains(@class,"app-autocomplete")][1]').locator('.app-autocomplete__button');
  }

  async searchIconBackgroundColour(): Promise<string> {
    return this.searchButton.evaluate((button) => getComputedStyle(button, '::before').backgroundColor);
  }

  async searchIconMaskImage(): Promise<string> {
    return this.searchButton.evaluate((button) => {
      const icon = getComputedStyle(button, '::before');
      return icon.maskImage || icon.getPropertyValue('-webkit-mask-image');
    });
  }

  announcement(text: string): Locator {
    const exactText = new RegExp(`^${text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}\\s*$`);
    return this.page.locator(`#${this.fieldId}__status--A, #${this.fieldId}__status--B`).filter({ hasText: exactText });
  }

  get select(): Locator {
    return this.page.locator(`select[name="${this.fieldId}"]`);
  }

  get error(): Locator {
    return this.page.locator(`#${this.fieldId}-error`);
  }

  get options(): Locator {
    return this.select.locator('option');
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

  async search(text: string): Promise<void> {
    await this.page.getByRole('combobox').and(this.field).waitFor();
    await this.field.click();
    await this.field.fill(text);
  }

  async searchAndHighlightFirstSuggestion(text: string): Promise<void> {
    await this.search(text);
    await this.suggestions.first().waitFor();
    await this.page.keyboard.press('ArrowDown');
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

import { type Locator, type Page } from '@playwright/test';

export class DatePicker {
  constructor(
    private readonly page: Page,
    private readonly fieldId: string,
  ) {}

  get root(): Locator {
    return this.page.locator(`.moj-datepicker:has(#${this.fieldId})`);
  }

  get input(): Locator {
    return this.page.locator(`#${this.fieldId}`);
  }

  get toggle(): Locator {
    return this.root.getByRole('button', { name: 'Choose date' });
  }

  get dialog(): Locator {
    return this.root.getByRole('dialog');
  }

  async open(): Promise<void> {
    await this.toggle.click();
  }

  async focusToggleByKeyboard(): Promise<void> {
    await this.input.focus();
    await this.page.keyboard.press('Tab');
  }

  async openByKeyboard(): Promise<void> {
    await this.focusToggleByKeyboard();
    await this.page.keyboard.press('Enter');
  }
}

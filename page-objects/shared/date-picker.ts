import { type Locator, type Page } from '@playwright/test';

export class DatePicker {
  constructor(
    private readonly page: Page,
    private readonly fieldId: string,
  ) {}

  get root(): Locator {
    return this.page.locator(`.moj-datepicker:has(#${this.fieldId})`);
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
}

import { expect, type Locator, type Page } from '@playwright/test';

const GOVUK_BLUE = 'rgb(29, 112, 184)';

export class DatePicker {
  constructor(
    private readonly page: Page,
    private readonly fieldId: string,
  ) {}

  private get root(): Locator {
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
    await expect(this.dialog).toBeVisible();
  }

  async expectToggleBlue(): Promise<void> {
    await expect(this.toggle).toHaveCSS('background-color', GOVUK_BLUE);
  }

  async expectCalendarEndsAbove(nextQuestionLabel: Locator): Promise<void> {
    await expect(nextQuestionLabel).toBeVisible();
    const calendarBottom = await this.dialog.evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
    const labelTop = await nextQuestionLabel.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

    expect(calendarBottom).toBeLessThanOrEqual(labelTop);
  }
}

import type { Locator } from '@playwright/test';
import { expect } from '@fixtures';
import type { DatePicker } from '@page-objects/shared/date-picker';
import { documentBottom, documentTop } from '@utils/document-position';

const GOVUK_BLUE = 'rgb(29, 112, 184)';

export const expectBlueToggleAndCalendarEndingAbove = async (picker: DatePicker, nextQuestionLabel: Locator): Promise<void> => {
  await expect(picker.toggle).toHaveCSS('background-color', GOVUK_BLUE);
  await picker.open();
  await expect(picker.dialog).toBeVisible();
  await expect(nextQuestionLabel).toBeVisible();
  expect(await documentBottom(picker.dialog)).toBeLessThanOrEqual(await documentTop(nextQuestionLabel));
};

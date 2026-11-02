import type { Page } from '@playwright/test';
import { getRelativeAppDateText } from '@utils/date-utils';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function utcDayOf(appDateText: string): number {
  const [day, month, year] = appDateText.split('/').map(Number);
  return Date.UTC(year, month - 1, day);
}

function shiftPickerBoundsOnceParsed(shiftInMs: number): void {
  const shiftBound = (element: Element, attribute: string): void => {
    const bound = element.getAttribute(attribute);
    if (!bound) {
      return;
    }
    const [day, month, year] = bound.split('/').map(Number);
    const shifted = new Date(Date.UTC(year, month - 1, day) + shiftInMs);
    element.setAttribute(attribute, `${shifted.getUTCDate()}/${shifted.getUTCMonth() + 1}/${shifted.getUTCFullYear()}`);
  };

  document.addEventListener('readystatechange', () => {
    if (document.readyState !== 'interactive') {
      return;
    }
    for (const picker of document.querySelectorAll('[data-min-date], [data-max-date]')) {
      shiftBound(picker, 'data-min-date');
      shiftBound(picker, 'data-max-date');
    }
  });
}

/**
 * Makes every date picker the page loads behave as though today were `today`
 * (a `yyyy-mm-dd` civil date): the browser clock stops at noon that day and
 * each picker's served `data-min-date` and `data-max-date` move by the same
 * number of days before the picker reads them. Call it before the page loads.
 */
export async function freezeDatePickersAt(page: Page, today: string): Promise<void> {
  const frozenDay = Date.parse(`${today}T00:00:00Z`);
  const shiftInMs = Math.round((frozenDay - utcDayOf(getRelativeAppDateText())) / DAY_IN_MS) * DAY_IN_MS;

  await page.clock.setFixedTime(new Date(`${today}T12:00:00Z`));
  await page.addInitScript(shiftPickerBoundsOnceParsed, shiftInMs);
}

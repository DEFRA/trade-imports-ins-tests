import { type Locator } from '@playwright/test';

export const documentTop = (locator: Locator): Promise<number> =>
  locator.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);

export const documentBottom = (locator: Locator): Promise<number> =>
  locator.evaluate((element) => element.getBoundingClientRect().bottom + window.scrollY);

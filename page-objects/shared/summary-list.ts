import type { Locator } from '@playwright/test';

export function valueOfTerm(scope: Locator, key: string): Locator {
  return scope
    .getByRole('term')
    .filter({ has: scope.page().getByText(key, { exact: true }) })
    .locator('xpath=following-sibling::dd[1]');
}

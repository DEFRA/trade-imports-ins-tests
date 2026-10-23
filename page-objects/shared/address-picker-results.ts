import { type Locator, type Page } from '@playwright/test';

const RESULTS_HEADING = 'Select an address';
const NO_MATCHES = 'No addresses match your search.';

export function pickerResultsHeading(page: Page): Locator {
  return page.getByRole('heading', { level: 2, name: RESULTS_HEADING });
}

export function pickerResultsSummary(page: Page): Locator {
  return pickerResultsHeading(page).locator('xpath=following-sibling::*[1][self::p]');
}

export function pickerResultsGroup(page: Page): Locator {
  return page.getByRole('group', { name: RESULTS_HEADING });
}

export function pickerNoMatchesMessage(page: Page): Locator {
  return page.getByText(NO_MATCHES, { exact: true });
}

export function pickerSearchBox(page: Page): Locator {
  return page.getByLabel('Search', { exact: true });
}

export function pickerSearchRow(page: Page): Locator {
  return pickerSearchBox(page).locator('xpath=ancestor::*[contains(@class,"govuk-form-group")][1]');
}

export function pickerSearchButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Search', exact: true });
}

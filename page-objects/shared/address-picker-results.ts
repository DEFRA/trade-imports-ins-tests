import { expect, type Locator, type Page } from '@playwright/test';

export const PICKER_RESULTS_HEADING = 'Select an address';
const NO_MATCHES = 'No addresses match your search.';

export const WHOLE_LIST_COUNT = /^Showing (\d+) out of \1 results$/;

export type AddressCellParts = {
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
};

export function expectedPickerAddressCellText({ addressLine1, addressLine2, townOrCity, county, postcode }: AddressCellParts): string {
  const placeLine = [townOrCity, county, postcode].filter(Boolean).join(', ');
  return [addressLine1, addressLine2, placeLine].filter(Boolean).join('\n');
}

export function pickerAddressRadio(page: Page, name: string): Locator {
  return page.getByRole('radio', { name: `Select ${name}`, exact: true });
}

export function pickerAddressRow(page: Page, name: string): Locator {
  return page.getByRole('row').filter({ has: pickerAddressRadio(page, name) });
}

export function pickerAddressCell(page: Page, name: string): Locator {
  return pickerAddressRow(page, name).getByRole('cell').nth(2);
}

export function pickerAddressCellText(page: Page, name: string): Promise<string> {
  return pickerAddressCell(page, name).evaluate((cell) => (cell as HTMLElement).innerText);
}

export function pickerLastCell(page: Page, name: string): Locator {
  return pickerAddressRow(page, name).getByRole('cell').last();
}

export function pickerResultsHeading(page: Page): Locator {
  return page.getByRole('heading', { level: 2, name: PICKER_RESULTS_HEADING });
}

export function paragraphFollowing(heading: Locator): Locator {
  return heading.locator('xpath=following-sibling::*[1][self::p]');
}

export function pickerResultsSummary(page: Page): Locator {
  return paragraphFollowing(pickerResultsHeading(page));
}

export function pickerResultsGroup(page: Page): Locator {
  return page.getByRole('group', { name: PICKER_RESULTS_HEADING });
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

export async function expectNothingBetweenSearchAndResults(resultsHeading: Locator): Promise<void> {
  await expect(resultsHeading.locator('xpath=preceding-sibling::*[1]')).toHaveClass(/govuk-form-group/);
}

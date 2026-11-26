import { expect, type Locator, type Page } from '@playwright/test';
import { expectEntirelyAbove } from '@page-objects/shared/layout-checks';

export const PICKER_RESULTS_HEADING = 'Select an address';
const NO_MATCHES = 'No addresses match your search.';

export const ADDRESSES_A_PAGE = 8;

function resultsCountSentence(shown: string, found: string): string {
  return `Showing ${shown} out of ${found} results`;
}

export const RESULTS_COUNT = new RegExp(`^${resultsCountSentence('\\d+', '\\d+')}$`);

export function pickerResultsCount(shown: number, found: number): string {
  return resultsCountSentence(String(shown), String(found));
}

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

export function pickerResultRows(page: Page): Locator {
  return pickerResultsGroup(page)
    .getByRole('row')
    .filter({ has: page.getByRole('radio') });
}

export function pickerResultRowsOutsideCountry(page: Page, countryLabel: string): Locator {
  return pickerResultRows(page).filter({ hasNot: page.getByRole('cell', { name: countryLabel, exact: true }) });
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

export function paragraphUnderResultsHeading(page: Page): Locator {
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

function textBetweenSearchAndResults(main: string): string {
  return main.slice(main.lastIndexOf('Search') + 'Search'.length, main.indexOf(PICKER_RESULTS_HEADING)).trim();
}

export async function expectChosenAddressNamedAboveResults(resultsHeading: Locator, name: string): Promise<void> {
  const page = resultsHeading.page();
  await expectEntirelyAbove(pickerSearchButton(page), resultsHeading);
  expect(textBetweenSearchAndResults(await page.getByRole('main').innerText())).toBe(`Selected address: ${name}`);
}

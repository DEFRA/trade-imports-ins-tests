import { expect, type Locator, type Page } from '@playwright/test';
import { expectEntirelyAbove } from '@page-objects/shared/layout-checks';

export const PICKER_RESULTS_HEADING = 'Select an address';
const NO_MATCHES = 'No addresses match your search.';

/** How many of a picker's addresses one page holds. */
export const ADDRESSES_A_PAGE = 8;

/** The count a picker reads for a list of any size: the rows this page shows
 * out of however many the list holds, which the organisation's book grows as
 * other tests add to it. */
export const PAGED_LIST_COUNT = /^Showing \d+ out of \d+ results$/;

export const WHOLE_LIST_COUNT = /^Showing (\d+) out of \1 results$/;

export function pickerPagination(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Pagination' });
}

export function pickerPageLink(page: Page, number: number): Locator {
  return page.getByRole('link', { name: `Page ${number}`, exact: true });
}

export function pickerSelectedAddress(page: Page): Locator {
  return page.locator('.govuk-inset-text');
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

export async function expectNothingBetweenSearchAndResults(resultsHeading: Locator): Promise<void> {
  const page = resultsHeading.page();
  await expectEntirelyAbove(pickerSearchButton(page), resultsHeading);
  expect(textBetweenSearchAndResults(await page.getByRole('main').innerText())).toBe('');
}

/** The picker names the address already chosen between its search box and its
 * results, so the choice shows on a page that does not hold its row. */
export async function expectChosenAddressNamedAboveResults(resultsHeading: Locator, name: string): Promise<void> {
  const page = resultsHeading.page();
  await expectEntirelyAbove(pickerSearchButton(page), resultsHeading);
  expect(textBetweenSearchAndResults(await page.getByRole('main').innerText())).toBe(`Selected address: ${name}`);
}

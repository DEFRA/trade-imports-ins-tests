import { type Locator } from '@playwright/test';
import { expect } from '@fixtures';
import type { InsPages } from '@page-objects';
import type { SharedPages } from '@page-objects';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { escapeRegex } from '@page-objects/shared/escape-regex';
import { transporterTab } from '@domain/ins/constants/address-book-types';

/** A transporter form page: the private and commercial pages share this much. */
export interface TransporterFormPage {
  readonly expectedUrl: string;
  open(): Promise<void>;
  readonly inputName: Locator;
  readonly linkCancelAndReturnToAddressBook: Locator;
}

/** Proves opening a transporter form with no transporter type chosen returns to the transporter
 * type question, for either form. */
export const expectOpensTypeQuestionWithNoTypeChosen = async (
  { pages, insPages, insJourney }: { pages: SharedPages; insPages: InsPages; insJourney: { toTransporterType: () => Promise<void> } },
  formPage: TransporterFormPage,
): Promise<void> => {
  await insJourney.toTransporterType();

  await formPage.open();

  await expect(pages.page).toHaveURL(new RegExp(`${escapeRegex(insPages.transporterType.expectedUrl)}$`));
  await expect(insPages.transporterType.heading).toBeVisible();
};

/** Proves Cancel on a transporter form with partial values entered reads the address-book cancel
 * label, lands on the address book filtered to transporters, and adds no transporter, for either
 * form. */
export const expectCancelAddsNoTransporter = async (
  { pages, insPages, addressBookApi }: { pages: SharedPages; insPages: InsPages; addressBookApi: AddressBookApiClient },
  formPage: TransporterFormPage,
  name: string,
): Promise<void> => {
  await formPage.inputName.fill(name);

  await formPage.linkCancelAndReturnToAddressBook.click();

  await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrlPattern(transporterTab));
  expect(await addressBookApi.listTransporters(name)).toEqual([]);
};

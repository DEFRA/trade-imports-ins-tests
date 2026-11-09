import { test, expect } from '@fixtures';
import { notApplicableApprovalNumber, transporterTypes } from '@domain/ins/constants/transporter-types';
import { transporterTypeFilterLabels } from '@domain/ins/constants/address-book-types';
import { privateTransporterDetails } from '@domain/ins/constants/trader-transporter';
import { transporterTab } from '@domain/ins/constants/address-book-types';
import { expectCancelAddsNoTransporter, expectOpensTypeQuestionWithNoTypeChosen } from './run-transporters';
import { trackTransporterForDeletion, transporterIdsDeletedAfterEachTest } from '@utils/transporter-cleanup';

const createdTransporterIds = transporterIdsDeletedAfterEachTest();

test.describe('The private transporter form', () => {
  test('opens with its caption, heading, the Standard Address Block and contact fields, and Back to the transporter type question', async ({
    insPages,
    insJourney,
  }) => {
    await insJourney.toPrivateTransporterFormFromList();

    const formPage = insPages.privateTransporter;
    await expect(formPage.caption).toBeVisible();
    await expect(formPage.heading).toBeVisible();
    await expect(formPage.sectionHeading('Address')).toBeVisible();
    await expect(formPage.sectionHeading('Contact details')).toBeVisible();
    await expect(formPage.selectCountry).toBeVisible();

    await formPage.linkBack.click();

    await expect(insPages.transporterType.heading).toBeVisible();
    await expect(insPages.transporterType.radio(transporterTypes.private)).toBeChecked();
  });

  test('opening it with no transporter type chosen returns to the transporter type question', async ({ pages, insPages, insJourney }) => {
    await expectOpensTypeQuestionWithNoTypeChosen({ pages, insPages, insJourney }, insPages.privateTransporter);
  });

  test('Cancel with partial values entered reads Cancel and return to address book, lands on the address book filtered to transporters, and adds no transporter', async ({
    pages,
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const name = `Cancelled Private Transporter ${Date.now()}`;
    await insJourney.toPrivateTransporterFormFromList();

    await expectCancelAddsNoTransporter({ pages, insPages, addressBookApi }, insPages.privateTransporter, name);
  });

  test('saving shows the success message and the address book filtered to transporters, the new transporter first with its type, address and country, and the not-applicable approval number, scoped to its organisation', async ({
    pages,
    insPages,
    insJourney,
    addressBookApi,
    isolatedOrganisationAddressBookApi,
  }) => {
    const name = `Saved Private Transporter ${Date.now()}`;

    await insJourney.addPrivateTransporterFromList(privateTransporterDetails(name));

    await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrlPattern(transporterTab));
    await expect(insPages.addressBookList.successBanner).toContainText(`${name} added to your address book`);
    const stored = await trackTransporterForDeletion(addressBookApi, name, createdTransporterIds);
    expect(stored.type).toBe(transporterTypes.private);
    expect(stored.approvalNumber).toBeFalsy();
    expect(stored.countryCode).toBe('GB');

    await insPages.addressBookList.search(name, { submitWith: 'button' });
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.transporterTypeCell(name)).toHaveText(transporterTypeFilterLabels.PRIVATE);
    await expect(insPages.addressBookList.transporterApprovalNumberCell(name)).toHaveText(notApplicableApprovalNumber);

    expect(await isolatedOrganisationAddressBookApi.listTransporters(name)).toEqual([]);
  });

  test('the Transporter tab search finds a saved private transporter by its name, its type word, its address and its country', async ({
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const name = `Searched Private Transporter ${Date.now()}`;
    await insJourney.addPrivateTransporterFromList(privateTransporterDetails(name));
    await trackTransporterForDeletion(addressBookApi, name, createdTransporterIds);

    for (const term of [name, 'Private', 'Carrier Close', 'United Kingdom']) {
      await insPages.addressBookList.open({ addressType: transporterTab.addressType });
      await insPages.addressBookList.search(term, { submitWith: 'button' });

      await expect(insPages.addressBookList.row(name)).toBeVisible();
    }
  });
});

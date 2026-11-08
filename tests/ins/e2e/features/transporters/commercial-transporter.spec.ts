import { test, expect } from '@fixtures';
import { transporterTypes, COMMERCIAL_TRANSPORTER_COUNTRY_NAME } from '@domain/ins/constants/transporter-types';
import { commercialTransporterDetails } from '@domain/ins/constants/trader-transporter';
import { transporterTab } from '@domain/ins/constants/address-book-types';
import { expectCancelAddsNoTransporter, expectOpensTypeQuestionWithNoTypeChosen } from './run-transporters';
import { transporterIdsDeletedAfterEachTest } from '@utils/transporter-cleanup';

const createdTransporterIds = transporterIdsDeletedAfterEachTest();

test.describe('The commercial transporter form', () => {
  test('opens with its caption, heading, the fixed Northern Ireland country, the Standard Address Block and contact fields, and Back to the transporter type question', async ({
    insPages,
    insJourney,
  }) => {
    await insJourney.toCommercialTransporterFormFromList();

    const formPage = insPages.commercialTransporter;
    await expect(formPage.caption).toBeVisible();
    await expect(formPage.heading).toBeVisible();
    await expect(formPage.inputApprovalNumber).toBeVisible();
    await expect(formPage.countryDisplay).toHaveText(COMMERCIAL_TRANSPORTER_COUNTRY_NAME);

    await formPage.linkBack.click();

    await expect(insPages.transporterType.heading).toBeVisible();
    await expect(insPages.transporterType.radio(transporterTypes.commercial)).toBeChecked();
  });

  test('opening it with no transporter type chosen returns to the transporter type question', async ({ pages, insPages, insJourney }) => {
    await expectOpensTypeQuestionWithNoTypeChosen({ pages, insPages, insJourney }, insPages.commercialTransporter);
  });

  test('Cancel with partial values entered reads Cancel and return to address book, lands on the address book filtered to transporters, and adds no transporter', async ({
    pages,
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const name = `Cancelled Commercial Transporter ${Date.now()}`;
    await insJourney.toCommercialTransporterFormFromList();

    await expectCancelAddsNoTransporter({ pages, insPages, addressBookApi }, insPages.commercialTransporter, name);
  });

  test('saving shows the success message and the address book filtered to transporters, the new transporter first with its type, address, approval number and country, scoped to its organisation', async ({
    pages,
    insPages,
    insJourney,
    addressBookApi,
    isolatedOrganisationAddressBookApi,
  }) => {
    const name = `Saved Commercial Transporter ${Date.now()}`;
    const approvalNumber = `NI/TA/${Date.now()}`;

    await insJourney.addCommercialTransporterFromList(commercialTransporterDetails(name, approvalNumber));

    await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrlPattern(transporterTab));
    await expect(insPages.addressBookList.successBanner).toContainText(`${name} added to your address book`);
    const stored = await addressBookApi.findTransporterByName(name);
    createdTransporterIds.push(stored.id);
    expect(stored.type).toBe(transporterTypes.commercial);
    expect(stored.approvalNumber).toBe(approvalNumber);
    expect(stored.countryCode).toBe('GB-NIR');

    await insPages.addressBookList.search(name, { submitWith: 'button' });
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.transporterTypeCell(name)).toHaveText('Commercial');
    await expect(insPages.addressBookList.transporterApprovalNumberCell(name)).toHaveText(approvalNumber);

    expect(await isolatedOrganisationAddressBookApi.listTransporters(name)).toEqual([]);
  });

  test('the Transporter tab search finds a saved commercial transporter by its name, its type word, its address, its approval number and its country', async ({
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const name = `Searched Commercial Transporter ${Date.now()}`;
    const approvalNumber = `NI/TA/${Date.now()}`;
    await insJourney.addCommercialTransporterFromList(commercialTransporterDetails(name, approvalNumber));
    const stored = await addressBookApi.findTransporterByName(name);
    createdTransporterIds.push(stored.id);

    for (const term of [name, 'Commercial', 'Shore Road', approvalNumber, COMMERCIAL_TRANSPORTER_COUNTRY_NAME]) {
      await insPages.addressBookList.open({ addressType: transporterTab.addressType });
      await insPages.addressBookList.search(term, { submitWith: 'button' });

      await expect(insPages.addressBookList.row(name)).toBeVisible();
    }
  });
});

import { test, expect } from '@fixtures';
import type { TransporterRequest } from '@adapters/http/address-book-api-client';
import { COMMERCIAL_TRANSPORTER_COUNTRY_CODE, transporterTypes } from '@domain/ins/constants/transporter-types';
import { transporterTab } from '@domain/ins/constants/address-book-types';
import { transporterIdsDeletedAfterEachTest } from '@utils/transporter-cleanup';

const privateTransporter = (name: string): TransporterRequest => ({
  name,
  addressLine1: '14 Haulage Way',
  townOrCity: 'Inverness',
  postcode: 'IV2 3JH',
  countryCode: 'GB',
  phone: '+44 1463 234567',
  email: 'ops@highland.example',
  type: transporterTypes.private,
});

const commercialTransporter = (name: string): TransporterRequest => ({
  name,
  addressLine1: '7 Dockside Way',
  townOrCity: 'Belfast',
  postcode: 'BT1 1AA',
  countryCode: COMMERCIAL_TRANSPORTER_COUNTRY_CODE,
  phone: '+44 28 9000 1122',
  email: 'ops@dockside.example',
  type: transporterTypes.commercial,
  approvalNumber: 'NI/TA/RECORD/0001',
});

test.describe("A transporter's own page", () => {
  const createdTransporterIds = transporterIdsDeletedAfterEachTest();

  test('opens at its own transporter URL, headed with the name, showing the address block and contact details', async ({
    pages,
    insPages,
    addressBookApi,
  }) => {
    const name = `Record Haulage Ltd ${Date.now()}`;
    const created = await addressBookApi.createTransporter(privateTransporter(name));
    createdTransporterIds.push(created.id);

    await insPages.addressBookTransporterView.open(created.id);

    await expect(pages.page).toHaveURL(insPages.addressBookTransporterView.expectedUrl(created.id));
    await expect(insPages.addressBookTransporterView.heading(name)).toBeVisible();
    await expect(insPages.addressBookTransporterView.summaryListValues.filter({ hasText: '14 Haulage Way' })).toBeVisible();
    await expect(insPages.addressBookTransporterView.summaryListValues.filter({ hasText: 'ops@highland.example' })).toBeVisible();
  });

  test('shows a commercial transporter its approval number and Northern Ireland, and a private one neither', async ({
    insPages,
    addressBookApi,
  }) => {
    const commercialName = `Record Commercial Ltd ${Date.now()}`;
    const commercial = await addressBookApi.createTransporter(commercialTransporter(commercialName));
    createdTransporterIds.push(commercial.id);

    await insPages.addressBookTransporterView.open(commercial.id);

    const keys = insPages.addressBookTransporterView.summaryListKeys;
    await expect(keys.filter({ hasText: 'Approval number' })).toBeVisible();
    await expect(insPages.addressBookTransporterView.summaryListValues.filter({ hasText: 'NI/TA/RECORD/0001' })).toBeVisible();
    await expect(insPages.addressBookTransporterView.summaryListValues.filter({ hasText: 'Northern Ireland' })).toBeVisible();

    const privateName = `Record Private Ltd ${Date.now()}`;
    const stored = await addressBookApi.createTransporter(privateTransporter(privateName));
    createdTransporterIds.push(stored.id);

    await insPages.addressBookTransporterView.open(stored.id);

    await expect(insPages.addressBookTransporterView.summaryListKeys.filter({ hasText: 'Approval number' })).toHaveCount(0);
  });

  test('offers Edit and Delete for that same transporter', async ({ insPages, addressBookApi }) => {
    const name = `Record Actions Ltd ${Date.now()}`;
    const created = await addressBookApi.createTransporter(privateTransporter(name));
    createdTransporterIds.push(created.id);

    await insPages.addressBookTransporterView.open(created.id);

    await expect(insPages.addressBookTransporterView.btnEdit).toHaveAttribute(
      'href',
      `${insPages.addressBookTransporterView.expectedUrl(created.id)}/edit`,
    );
    await expect(insPages.addressBookTransporterView.btnDelete).toHaveAttribute(
      'href',
      `${insPages.addressBookTransporterView.expectedUrl(created.id)}/delete`,
    );
  });

  test('Back goes to the address book filtered to transporters', async ({ pages, insPages, addressBookApi }) => {
    const name = `Record Back Ltd ${Date.now()}`;
    const created = await addressBookApi.createTransporter(privateTransporter(name));
    createdTransporterIds.push(created.id);

    await insPages.addressBookTransporterView.open(created.id);

    await insPages.addressBookTransporterView.linkBack.click();

    await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrlPattern(transporterTab));
  });
});

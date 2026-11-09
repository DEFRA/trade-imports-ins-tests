import { test, expect } from '@fixtures';
import type { TransporterRequest } from '@adapters/http/address-book-api-client';
import { transporterTypes } from '@domain/ins/constants/transporter-types';

const commercialTransporter: Omit<TransporterRequest, 'name'> = {
  addressLine1: '7 Dockside Way',
  townOrCity: 'Belfast',
  postcode: 'BT1 1AA',
  countryCode: 'GB-NIR',
  phone: '+44 28 9000 1122',
  email: 'ops@crossservice.example',
  type: transporterTypes.commercial,
  approvalNumber: 'NI/TA/CROSS/0001',
};

test.describe('A transporter added through the INS address book', { tag: ['@address-book', '@ins-frontend'] }, () => {
  test("is on the transporter list of the organisation's next notification, with its approval number, and can be picked and saved", async ({
    animalsJourney,
    animalsPages,
    addressBookApi,
  }) => {
    const name = `Cross Service Haulage Ltd ${Date.now()}`;
    const created = await addressBookApi.createTransporter({ ...commercialTransporter, name });

    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();
    await animalsJourney.reachTransporterFromHub();

    await expect(animalsPages.transporter.transporter(name)).toBeVisible();
    const row = animalsPages.transporter.rowFor(name);
    await expect(animalsPages.transporter.approvalNumberCell(row)).toHaveText(created.approvalNumber ?? '');

    await animalsPages.transporter.transporter(name).check();
    await animalsPages.transporter.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsJourney.openTransporterFromOverview();
    await expect(animalsPages.transporter.transporter(name)).toBeChecked();

    await addressBookApi.deleteTransporter(created.id);
  });

  test("its View details link opens the transporter's address book record, and Back returns to this list", async ({
    pages,
    animalsJourney,
    animalsPages,
    insPages,
    addressBookApi,
  }) => {
    const name = `Returning Haulage Ltd ${Date.now()}`;
    const created = await addressBookApi.createTransporter({ ...commercialTransporter, name });

    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();
    await animalsJourney.reachTransporterFromHub();
    const listUrl = pages.page.url();

    await animalsPages.transporter.viewDetails(name);

    await expect(insPages.addressBookView.heading(name)).toBeVisible();
    await insPages.addressBookView.linkBack.click();

    await expect(pages.page).toHaveURL(listUrl);
    await expect(animalsPages.transporter.heading).toBeVisible();

    await addressBookApi.deleteTransporter(created.id);
  });
});

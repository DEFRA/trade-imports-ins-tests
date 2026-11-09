import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { transporterTab, typeFilterPlaceholder, transporterTypeFilterLabels } from '@domain/ins/constants/address-book-types';
import { commercialTransporterDetails, privateTransporterDetails, transporterRequestOf } from '@domain/ins/constants/trader-transporter';
import { transporterTypes } from '@domain/ins/constants/transporter-types';
import { transporterIdsDeletedAfterEachTest } from '@utils/transporter-cleanup';

const createdTransporterIds = transporterIdsDeletedAfterEachTest();

const transporterTypeFilterTermOf = (scenario: string): string => `Typefilter ${scenario} ${randomUUID()}`;

test.describe('Transporter tab Type filter', () => {
  test('offers Select one, then Commercial and Private, in that order', async ({ insPages, insJourney }) => {
    await insJourney.toAddressBookTab(transporterTab);

    await expect(insPages.addressBookList.typeFilterOptions).toHaveText([
      typeFilterPlaceholder,
      ...transporterTab.typeFilterOptions.map((type) => transporterTypeFilterLabels[type]),
    ]);
    await expect(insPages.addressBookList.typeFilterOptions.first()).toHaveAttribute('value', '');
  });

  test('a Type filter finds the transporters holding it beyond the first page of the tab, counted and without pagination', async ({
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const term = transporterTypeFilterTermOf('beyond first page');
    for (const suffix of ['First Commercial', 'Second Commercial']) {
      const transporter = await addressBookApi.createTransporter(
        transporterRequestOf(commercialTransporterDetails(`${term} ${suffix}`, `NI/TA/${randomUUID()}`), transporterTypes.commercial),
      );
      createdTransporterIds.push(transporter.id);
    }
    for (let index = 1; index <= 9; index++) {
      const transporter = await addressBookApi.createTransporter(
        transporterRequestOf(privateTransporterDetails(`${term} Private ${index}`), transporterTypes.private),
      );
      createdTransporterIds.push(transporter.id);
    }

    await insJourney.toAddressBookTab(transporterTab, { search: term });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-8 of 11');

    await insPages.addressBookList.filter({ term, submitWith: 'button', label: transporterTypeFilterLabels.COMMERCIAL });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-2 of 2');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(2);
    await expect(insPages.addressBookList.row(`${term} First Commercial`)).toBeVisible();
    await expect(insPages.addressBookList.row(`${term} Second Commercial`)).toBeVisible();
    await expect(insPages.addressBookList.pagination).toHaveCount(0);
  });
});

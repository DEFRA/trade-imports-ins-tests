import type { Locator } from '@playwright/test';
import { test, expect } from '@fixtures';
import { ARRIVAL_DATE } from '@flows/animals/journey';
import { pointOfEntries } from '@domain/animals/constants/point-of-entries';
import { commodityLines, speciesCardTitle } from '@domain/animals/constants/commodity-lines';

test.describe('Hub groups and check-your-answers rows', { tag: '@duplicated-in-frontend' }, () => {
  test('the hub groups its tasks under the six numbered group headings, with nothing after them', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();

    await expect(pages.page.getByRole('heading', { level: 2, name: 'Notification tasklist' })).toBeVisible();

    await expect(animalsPages.overview.numberedSectionHeadings).toHaveText([
      '1. About the consignment',
      '2. Description of the goods',
      '3. Transport and arrival',
      '4. Documents',
      '5. Consignment parties',
      '6. Contact address',
    ]);

    await expect(pages.page.locator('.govuk-button-group .govuk-button')).toHaveText(['Review and submit', 'Return to dashboard']);

    const taskLists = pages.page.locator('ul.app-task-list');
    await expect(taskLists).toHaveCount(6);
    const expectListedTasks = async (list: Locator, tasks: string[]) => {
      for (const task of tasks) await expect(list).toContainText(task);
    };
    await expectListedTasks(taskLists.nth(0), [
      'Where is this consignment coming from?',
      'What are you importing?',
      'Main reason for import',
    ]);
    await expectListedTasks(taskLists.nth(1), ['Additional details']);
    await expect(taskLists.nth(1)).not.toContainText('Identification details');
    await expectListedTasks(taskLists.nth(2), ['Arrival details', 'Transport details']);
    await expectListedTasks(taskLists.nth(3), ['Upload documents']);
    await expectListedTasks(taskLists.nth(4), ['Roles and addresses']);
    await expectListedTasks(taskLists.nth(5), ['Contact address for this consignment']);
  });

  test('after completing every section the check-your-answers page renders the answered rows', async ({
    animalsJourney,
    pages,
    animalsPages,
    referenceDataApi,
  }) => {
    test.slow();
    await animalsJourney.toReview();
    const commonName = await referenceDataApi.findCommonName(commodityLines.cattle);

    const value = (card: Locator, key: string) =>
      card.locator('.govuk-summary-list__row', { has: pages.page.getByText(key, { exact: true }) }).locator('.govuk-summary-list__value');

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '1. About the consignment' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '2. Description of the goods' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '3. Transport and arrival' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '4. Documents' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '5. Consignment parties' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '6. Contact address' })).toBeVisible();
    await expect(animalsPages.notificationView.summaryCard('Uploaded documents')).toContainText('You have not added any documents yet.');
    await expect(animalsPages.notificationView.changeLink('Change uploaded documents')).toBeVisible();

    await expect(pages.page.getByRole('heading', { level: 3, name: 'Where is this consignment coming from?' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 3, name: 'Commodity details' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 3, name: 'Additional details' })).toBeVisible();

    const importDetails = animalsPages.notificationView.summaryCard('Import details');
    await expect(value(importDetails, 'Country of origin')).toHaveText('France');
    await expect(value(importDetails, 'Region of origin code required')).toHaveText('Yes');
    await expect(value(importDetails, 'Region of origin code')).toHaveText('FR-75');
    await expect(value(importDetails, 'Internal reference number')).toHaveText('Imports456GB');

    const additionalAnimalDetails = animalsPages.notificationView.summaryCard('Additional animal details');
    await expect(value(additionalAnimalDetails, 'Certified for')).toHaveText('Slaughter');
    await expect(value(additionalAnimalDetails, 'Includes unweaned animals')).toHaveText('No');

    const reasonForImport = animalsPages.notificationView.summaryCard('Reason for import');
    await expect(value(reasonForImport, 'Reason for import')).toHaveText('Internal market');
    await expect(value(reasonForImport, 'Purpose in the market')).toHaveText('Breeding');

    const speciesCard = animalsPages.notificationView.summaryCard(speciesCardTitle(commodityLines.cattle));
    await expect(value(speciesCard, 'Commodity code')).toHaveText(commodityLines.cattle.commodityCode);
    await expect(value(speciesCard, 'Common name')).toHaveText(commonName);
    await expect(value(speciesCard, 'Species')).toHaveText(commodityLines.cattle.latinName);
    await expect(value(speciesCard, 'Number of animals')).toHaveText('1');
    await expect(value(speciesCard, 'Number of packages')).toHaveText('5');
    await expect(speciesCard.getByRole('heading', { name: 'Animal details' })).toBeVisible();
    await expect(speciesCard.getByRole('columnheader', { name: 'Ear tag' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: 'Animal 1' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: 'UK123456789012' })).toBeVisible();

    const arrivalDetails = animalsPages.notificationView.summaryCard('Arrival details');
    await expect(value(arrivalDetails, 'Port of entry')).toHaveText(pointOfEntries.aberdeenHarbour.display);
    await expect(value(arrivalDetails, 'Arrival date at port of entry')).toHaveText(ARRIVAL_DATE);
    await expect(value(arrivalDetails, 'Means of transport to the port of entry')).toHaveText('Road Vehicle');
    await expect(value(arrivalDetails, 'Transport identification')).toHaveText('FR-892-LK');
    await expect(value(arrivalDetails, 'Transport document reference')).toHaveText('CMR-2026-884721');

    const transitCountries = animalsPages.notificationView.summaryCard('Transit countries');
    await expect(value(transitCountries, 'Countries that the consignment will travel through')).toHaveText('France, Belgium');

    const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
    await expect(value(transportDetails, 'Name')).toContainText('García Livestock Transport SL');
    await expect(value(transportDetails, 'Type')).toHaveText('Commercial');

    const rolesAndAddresses = animalsPages.notificationView.summaryCard('Roles and addresses');
    await expect(value(rolesAndAddresses, 'Place of origin')).toContainText('Origin Farm');
    await expect(value(rolesAndAddresses, 'Consignor')).toContainText('Astra Rosales');
    await expect(value(rolesAndAddresses, 'Consignee')).toContainText('British Livestock Ltd');
    await expect(value(rolesAndAddresses, 'Importer')).toContainText('Import Co UK');
    await expect(value(rolesAndAddresses, 'Place of destination')).toContainText('Tech Imports Ltd');
    await expect(value(rolesAndAddresses, 'County parish holding (CPH) number')).toHaveText('123456789');

    const contactAddress = animalsPages.notificationView.summaryCard('Contact address for this consignment');
    await expect(value(contactAddress, 'Contact address')).toContainText('Animal and Plant Health Agency');
  });
});

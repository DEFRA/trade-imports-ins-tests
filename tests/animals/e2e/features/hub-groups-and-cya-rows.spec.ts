import type { Locator } from '@playwright/test';
import { test, expect } from '@fixtures';
import { ARRIVAL_DATE } from '@flows/animals/journey';

test.describe('Hub groups and check-your-answers rows', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the hub groups its tasks under the six numbered group headings, with nothing after them', async ({ animalsJourney, pages }) => {
    await animalsJourney.startNotification();

    // Design release 1 sits the whole list under its own heading, so the
    // section captions dropped from h2 to h3.
    await expect(pages.page.getByRole('heading', { level: 2, name: 'Notification tasklist' })).toBeVisible();

    // The commodity-total labels are h3s too, so the section headings are read
    // off their own class rather than off the level alone.
    await expect(pages.page.locator('h3.govuk-heading-m')).toHaveText([
      '1. About the consignment',
      '2. Description of the goods',
      '3. Transport and arrival',
      '4. Documents',
      '5. Consignment parties',
      '6. Contact address',
    ]);

    // Design release 1 ends the hub with the review as a primary button beside
    // the secondary return, not as a seventh section holding a locked row.
    await expect(pages.page.locator('.govuk-button-group .govuk-button')).toHaveText(['Review and submit', 'Return to dashboard']);

    // One task list per group, in the same order as the headings. Conditional
    // rows (exit details, transit countries, animal identification) are not
    // owed on a fresh notification, so only the always-present tasks are
    // pinned per group.
    const taskLists = pages.page.locator('ul.app-task-list');
    await expect(taskLists).toHaveCount(6);
    const expectListedTasks = async (list: Locator, tasks: string[]) => {
      for (const task of tasks) await expect(list).toContainText(task);
    };
    await expectListedTasks(taskLists.nth(0), ['Where is this consignment coming from?', 'What are you importing?', 'Main import reason']);
    await expectListedTasks(taskLists.nth(1), ['Additional details']);
    // Identification is only owed once a chosen commodity carries identifiers,
    // and nothing has been chosen yet, so the row is off the hub altogether.
    await expect(taskLists.nth(1)).not.toContainText('Identification details');
    await expectListedTasks(taskLists.nth(2), ['Arrival details', 'Transport details']);
    await expectListedTasks(taskLists.nth(3), ['Upload documents']);
    await expectListedTasks(taskLists.nth(4), ['Roles and addresses']);
    await expectListedTasks(taskLists.nth(5), ['Contact address for this consignment']);
  });

  test('the hub marks the commodity summary, its two cards, the task list and each numbered section as named regions', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();

    const summary = animalsPages.overview.region('Your commodities');
    await expect(summary.getByRole('region')).toHaveCount(2);
    await expect(summary.getByRole('region', { name: 'Animals summary', exact: true })).toBeVisible();
    await expect(summary.getByRole('region', { name: 'Packages summary', exact: true })).toBeVisible();

    const taskList = animalsPages.overview.region('Notification tasklist');
    await expect(taskList.getByRole('region')).toHaveCount(6);
    for (const caption of [
      '1. About the consignment',
      '2. Description of the goods',
      '3. Transport and arrival',
      '4. Documents',
      '5. Consignment parties',
      '6. Contact address',
    ]) {
      await expect(taskList.getByRole('region', { name: caption, exact: true })).toBeVisible();
    }
    await expect(
      taskList
        .getByRole('region', { name: '1. About the consignment', exact: true })
        .getByRole('link', { name: 'Main import reason', exact: true }),
    ).toBeVisible();
    await expect(animalsPages.overview.task('Main reason for import')).toHaveCount(0);

    await expect(animalsPages.overview.task('Roles and addresses')).toHaveAccessibleDescription(
      'Consignor or Exporter, Consignee, Importer and Place of Destination To do',
    );
  });

  test('after completing every section the check-your-answers page renders the answered rows', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();
    await animalsJourney.toReview();

    const value = (card: Locator, key: string) =>
      card.locator('.govuk-summary-list__row', { has: pages.page.getByText(key, { exact: true }) }).locator('.govuk-summary-list__value');

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '1. About the consignment' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '2. Description of the goods' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '3. Transport and arrival' })).toBeVisible();
    // Documents are optional, so the Uploaded documents section stands even with nothing uploaded.
    await expect(pages.page.getByRole('heading', { level: 2, name: '4. Uploaded documents' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '5. Consignment addresses' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '6. Contact address' })).toBeVisible();
    await expect(animalsPages.notificationView.summaryCard('Uploaded documents')).toContainText('You have not added any documents yet.');
    await expect(animalsPages.notificationView.changeLink('Change uploaded documents')).toBeVisible();

    for (const title of ['Origin of import', 'Main import reason', 'Additional details', 'Addresses', 'Contact address']) {
      await expect(pages.page.getByRole('heading', { level: 3, name: title, exact: true })).toBeVisible();
    }
    for (const subsection of [
      'Where is this consignment coming from?',
      'Commodity details',
      'Upload documents',
      'Roles and addresses',
      'Contact address for this consignment',
      'Main reason for import',
    ]) {
      await expect(pages.page.getByRole('heading', { name: subsection })).toHaveCount(0);
    }
    // The only level-4 heading is "Animal details" in the Cow card, because this journey uploads no documents.
    await expect(pages.page.getByRole('heading', { level: 4, name: 'Animal details' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 4 })).toHaveCount(1);

    const importDetails = animalsPages.notificationView.summaryCard('Origin of import');
    await expect(value(importDetails, 'Country of origin')).toHaveText('France');
    await expect(value(importDetails, 'Region of origin code required')).toHaveText('Yes');
    await expect(value(importDetails, 'Region of origin code')).toHaveText('FR-75');
    await expect(value(importDetails, 'Internal reference number')).toHaveText('Imports456GB');

    const additionalAnimalDetails = animalsPages.notificationView.summaryCard('Additional details');
    await expect(value(additionalAnimalDetails, 'Certified for')).toHaveText('Slaughter');
    await expect(value(additionalAnimalDetails, 'Includes unweaned animals')).toHaveText('No');

    const reasonForImport = animalsPages.notificationView.summaryCard('Main import reason');
    await expect(value(reasonForImport, 'Main import reason')).toHaveText('Internal market');
    await expect(value(reasonForImport, 'Purpose in the market')).toHaveText('Breeding');

    const speciesCard = animalsPages.notificationView.summaryCard('Cow (0102) — Bos taurus');
    await expect(value(speciesCard, 'Commodity code')).toHaveText('0102');
    await expect(value(speciesCard, 'Common name')).toHaveText('Cow');
    await expect(value(speciesCard, 'Species')).toHaveText('Bos taurus');
    await expect(value(speciesCard, 'Number of animals')).toHaveText('1');
    await expect(value(speciesCard, 'Number of packages')).toHaveText('5');
    await expect(speciesCard.getByRole('heading', { name: 'Animal details' })).toBeVisible();
    await expect(speciesCard.getByRole('columnheader', { name: 'Ear tag' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: 'Animal 1' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: 'UK123456789012' })).toBeVisible();

    const arrivalDetails = animalsPages.notificationView.summaryCard('Arrival details');
    await expect(value(arrivalDetails, 'Port of entry')).toHaveText('Aberdeen Harbour (GB ABD)');
    await expect(value(arrivalDetails, 'Arrival date at port of entry')).toHaveText(ARRIVAL_DATE);
    await expect(value(arrivalDetails, 'Means of transport to the port of entry')).toHaveText('Road');
    await expect(value(arrivalDetails, 'Transport identification')).toHaveText('FR-892-LK');
    await expect(value(arrivalDetails, 'Transport document reference')).toHaveText('CMR-2026-884721');

    const transitCountries = animalsPages.notificationView.summaryCard('Transit countries');
    // Read back in the order they were added, not alphabetically.
    await expect(value(transitCountries, 'Countries that the consignment will travel through')).toHaveText('France, Belgium');

    const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
    await expect(value(transportDetails, 'Name')).toContainText('García Livestock Transport SL');
    await expect(value(transportDetails, 'Type')).toHaveText('Commercial');

    const rolesAndAddresses = animalsPages.notificationView.summaryCard('Addresses');
    await expect(value(rolesAndAddresses, 'Place of origin')).toContainText('Origin Farm');
    await expect(value(rolesAndAddresses, 'Consignor')).toContainText('Astra Rosales');
    await expect(value(rolesAndAddresses, 'Consignee')).toContainText('British Livestock Ltd');
    await expect(value(rolesAndAddresses, 'Importer')).toContainText('Import Co UK');
    await expect(value(rolesAndAddresses, 'Place of destination')).toContainText('Tech Imports Ltd');
    // The CYA renders the CPH normalised (separators stripped), not as typed.
    await expect(value(rolesAndAddresses, 'County parish holding (CPH) number')).toHaveText('123456789');

    const contactAddress = animalsPages.notificationView.summaryCard('Contact address');
    await expect(value(contactAddress, 'Contact address')).toContainText('Animal and Plant Health Agency');
  });
});

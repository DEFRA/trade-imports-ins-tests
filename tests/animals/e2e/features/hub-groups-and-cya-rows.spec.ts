import type { Locator } from '@playwright/test';
import { test, expect } from '@fixtures';
import { ALL_ANSWERS_WITHOUT_DOCUMENT, CPH_NUMBER } from '@domain/animals/constants/journey-options';

test.describe('Hub groups and check-your-answers rows', { tag: '@duplicated-in-frontend' }, () => {
  test('the hub groups its tasks under the six numbered group headings, with nothing after them', async ({ animalsJourney, pages }) => {
    await animalsJourney.startNotification();

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
  }) => {
    test.slow();
    const answers = ALL_ANSWERS_WITHOUT_DOCUMENT;
    await animalsJourney.toReview(answers);

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
    await expect(value(importDetails, 'Country of origin')).toHaveText(answers.countryCode.display);
    await expect(value(importDetails, 'Region of origin code required')).toHaveText('Yes');
    await expect(value(importDetails, 'Region of origin code')).toHaveText(`${answers.countryCode.value}-${answers.regionCode}`);
    await expect(value(importDetails, 'Internal reference number')).toHaveText(answers.internalReference);

    const additionalAnimalDetails = animalsPages.notificationView.summaryCard('Additional animal details');
    await expect(value(additionalAnimalDetails, 'Certified for')).toHaveText(answers.certifiedFor.display);
    await expect(value(additionalAnimalDetails, 'Includes unweaned animals')).toHaveText('No');

    const reasonForImport = animalsPages.notificationView.summaryCard('Reason for import');
    await expect(value(reasonForImport, 'Reason for import')).toHaveText(answers.importReason.display);
    await expect(value(reasonForImport, 'Purpose in the market')).toHaveText(answers.internalMarketPurpose.display);

    const speciesCard = animalsPages.notificationView.summaryCard('Cow (0102) — Bos taurus');
    await expect(value(speciesCard, 'Commodity code')).toHaveText('0102');
    await expect(value(speciesCard, 'Common name')).toHaveText('Cow');
    await expect(value(speciesCard, 'Species')).toHaveText('Bos taurus');
    await expect(value(speciesCard, 'Number of animals')).toHaveText(String(answers.noOfAnimals));
    await expect(value(speciesCard, 'Number of packages')).toHaveText(String(answers.noOfPackages));
    await expect(speciesCard.getByRole('heading', { name: 'Animal details' })).toBeVisible();
    await expect(speciesCard.getByRole('columnheader', { name: 'Ear tag' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: 'Animal 1' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: answers.earTag })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: answers.passportNumber })).toBeVisible();

    const arrivalDetails = animalsPages.notificationView.summaryCard('Arrival details');
    await expect(value(arrivalDetails, 'Port of entry')).toHaveText(answers.pointOfEntry.display);
    await expect(value(arrivalDetails, 'Arrival date at port of entry')).toHaveText(answers.arrivalDate);
    await expect(value(arrivalDetails, 'Means of transport to the port of entry')).toHaveText(answers.meansOfTransport.display);
    await expect(value(arrivalDetails, 'Transport identification')).toHaveText(answers.transportIdentification);
    await expect(value(arrivalDetails, 'Transport document reference')).toHaveText(answers.transportDocumentReference);

    const transitCountries = animalsPages.notificationView.summaryCard('Transit countries');
    await expect(value(transitCountries, 'Countries that the consignment will travel through')).toHaveText(
      answers.transitedCountries.map(({ display }) => display).join(', '),
    );

    const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
    await expect(value(transportDetails, 'Name')).toContainText(answers.transporter.display);
    await expect(value(transportDetails, 'Type')).toHaveText('Commercial');

    const rolesAndAddresses = animalsPages.notificationView.summaryCard('Roles and addresses');
    await expect(value(rolesAndAddresses, 'Place of origin')).toContainText(answers.parties.placeOfOrigin);
    await expect(value(rolesAndAddresses, 'Consignor')).toContainText(answers.parties.consignor);
    await expect(value(rolesAndAddresses, 'Consignee')).toContainText(answers.parties.consignee);
    await expect(value(rolesAndAddresses, 'Importer')).toContainText(answers.parties.importer);
    await expect(value(rolesAndAddresses, 'Place of destination')).toContainText(answers.parties.placeOfDestination);
    await expect(value(rolesAndAddresses, 'County parish holding (CPH) number')).toHaveText(CPH_NUMBER);

    const contactAddress = animalsPages.notificationView.summaryCard('Contact address for this consignment');
    await expect(value(contactAddress, 'Contact address')).toContainText(answers.contactAddress);
  });
});

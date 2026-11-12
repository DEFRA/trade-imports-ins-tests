import { test, expect } from '@fixtures';
import { IMPORT_REASON_TASK } from '@domain/animals/constants/import-reason-page';
import {
  ALL_ANSWERS_WITHOUT_DOCUMENT,
  CPH_NUMBER,
  MANDATORY_ANSWERS,
  type NotificationAnswers,
} from '@domain/animals/constants/journey-options';
import { MANDATORY_COMMODITY_LINES } from '@domain/animals/constants/journey-commodity-line-answers';

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

    await expect(pages.page.locator('ul.app-task-list')).toHaveCount(6);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('1. About the consignment')).toHaveText([
      'Where is this consignment coming from?',
      'What are you importing?',
      IMPORT_REASON_TASK,
    ]);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('2. Description of the goods')).toHaveText([
      'Commodity details',
      'Additional details',
    ]);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('3. Transport and arrival')).toHaveText([
      'Arrival details',
      'Transport details',
    ]);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('4. Documents')).toHaveText(['Upload documents']);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('5. Consignment parties')).toHaveText(['Roles and addresses']);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('6. Contact address')).toHaveText([
      'Contact address for this consignment',
    ]);
  });

  test('after completing every section the check-your-answers page renders the answered rows', async ({
    animalsJourney,
    pages,
    animalsPages,
    referenceDataApi,
  }) => {
    test.slow();
    const answers = ALL_ANSWERS_WITHOUT_DOCUMENT;
    const [cowLine] = answers.commodityLines;
    await animalsJourney.toReview(answers);
    const commonName = await referenceDataApi.findCommonName(cowLine.species);

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '1. About the consignment' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '2. Description of the goods' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '3. Transport and arrival' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '4. Documents' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '5. Consignment parties' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '6. Contact address' })).toBeVisible();
    await expect(animalsPages.notificationView.summaryCard('Uploaded documents')).toContainText('You have not added any documents yet.');
    await expect(animalsPages.notificationView.changeLink('Change uploaded documents')).toBeVisible();

    await expect(pages.page.getByRole('heading', { level: 3 })).toHaveText([
      'Where is this consignment coming from?',
      'Main import reason',
      'Commodity details',
      'Additional details',
      'Arrival details',
      'Transit countries',
      'Transport details',
      'Upload documents',
      'Roles and addresses',
      'Contact address for this consignment',
    ]);

    const importDetails = animalsPages.notificationView.summaryCard('Import details');
    await expect(animalsPages.notificationView.summaryValue(importDetails, 'Country of origin')).toHaveText(answers.countryCode.display);
    await expect(animalsPages.notificationView.summaryValue(importDetails, 'Region of origin code required')).toHaveText('Yes');
    await expect(animalsPages.notificationView.regionOfOriginCode).toHaveText(`${answers.countryCode.value}-${answers.regionCode}`);
    await expect(animalsPages.notificationView.summaryValue(importDetails, 'Internal reference number')).toHaveText(
      answers.internalReference,
    );

    const additionalAnimalDetails = animalsPages.notificationView.summaryCard('Additional animal details');
    await expect(animalsPages.notificationView.summaryValue(additionalAnimalDetails, 'Certified for')).toHaveText(
      answers.certifiedFor.display,
    );
    await expect(animalsPages.notificationView.summaryValue(additionalAnimalDetails, 'Includes unweaned animals')).toHaveText('No');

    const reasonForImport = animalsPages.notificationView.summaryCard('Reason for import');
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Reason for import')).toHaveText(answers.importReason.display);
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Purpose in the market')).toHaveText(
      answers.internalMarketPurpose.display,
    );

    const speciesCard = animalsPages.notificationView.speciesCard(cowLine.species);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Commodity code')).toHaveText(cowLine.species.commodityCode);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Common name')).toHaveText(commonName);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Species')).toHaveText(cowLine.species.latinName);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Number of animals')).toHaveText(String(cowLine.noOfAnimals));
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Number of packages')).toHaveText(String(cowLine.noOfPackages));
    await expect(speciesCard.getByRole('heading', { name: 'Animal details' })).toBeVisible();
    await expect(speciesCard.getByRole('columnheader', { name: 'Ear tag' })).toBeVisible();
    await expect(speciesCard.getByRole('columnheader', { name: 'Tattoo' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: 'Animal 1' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: cowLine.earTag })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: cowLine.passportNumber })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: cowLine.tattoo })).toBeVisible();

    const arrivalDetails = animalsPages.notificationView.summaryCard('Arrival details');
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Port of entry')).toHaveText(answers.pointOfEntry.display);
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Arrival date at port of entry')).toHaveText(
      answers.arrivalDate,
    );
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Means of transport to the port of entry')).toHaveText(
      answers.meansOfTransport.display,
    );
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Transport identification')).toHaveText(
      answers.transportIdentification,
    );
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Transport document reference')).toHaveText(
      answers.transportDocumentReference,
    );

    const transitCountries = animalsPages.notificationView.summaryCard('Transit countries');
    await expect(
      animalsPages.notificationView.summaryValue(transitCountries, 'Countries that the consignment will travel through'),
    ).toHaveText(answers.transitedCountries.map(({ display }) => display).join(', '));

    const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Name')).toContainText(answers.transporter.display);
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Type')).toHaveText('Commercial');

    const rolesAndAddresses = animalsPages.notificationView.summaryCard('Roles and addresses');
    await expect(animalsPages.notificationView.summaryValue(rolesAndAddresses, 'Place of origin')).toContainText(
      answers.parties.placeOfOrigin,
    );
    await expect(animalsPages.notificationView.summaryValue(rolesAndAddresses, 'Consignor')).toContainText(answers.parties.consignor);
    await expect(animalsPages.notificationView.summaryValue(rolesAndAddresses, 'Consignee')).toContainText(answers.parties.consignee);
    await expect(animalsPages.notificationView.summaryValue(rolesAndAddresses, 'Importer')).toContainText(answers.parties.importer);
    await expect(animalsPages.notificationView.summaryValue(rolesAndAddresses, 'Place of destination')).toContainText(
      answers.parties.placeOfDestination,
    );
    await expect(animalsPages.notificationView.summaryValue(rolesAndAddresses, 'County parish holding (CPH) number')).toHaveText(
      CPH_NUMBER,
    );

    const contactAddress = animalsPages.notificationView.summaryCard('Contact address for this consignment');
    await expect(animalsPages.notificationView.summaryValue(contactAddress, 'Contact address')).toContainText(answers.contactAddress);
  });

  test('the roles-and-addresses card shows a cat’s saved permanent address, keyed by its common name and number', async ({
    animalsJourney,
    animalsPages,
    referenceDataApi,
  }) => {
    const answers: NotificationAnswers = {
      ...MANDATORY_ANSWERS,
      commodityLines: [MANDATORY_COMMODITY_LINES.domesticCat],
    };
    await animalsJourney.toReview(answers);
    const commonName = await referenceDataApi.findCommonName(MANDATORY_COMMODITY_LINES.domesticCat.species);

    const rolesAndAddresses = animalsPages.notificationView.summaryCard('Roles and addresses');
    const { permanentAddress: address } = MANDATORY_COMMODITY_LINES.domesticCat;
    const permanentAddressRow = animalsPages.notificationView.summaryValue(rolesAndAddresses, `${commonName} 1`);
    await expect(permanentAddressRow).toContainText(address.nameOrOrganisationName);
    await expect(permanentAddressRow).toContainText(address.addressLine1);
    await expect(permanentAddressRow).toContainText(address.townOrCity);
    await expect(permanentAddressRow).toContainText(address.postcode);
    await expect(permanentAddressRow).toContainText('United Kingdom');
    await expect(permanentAddressRow).toContainText(address.phone);
    await expect(permanentAddressRow).toContainText(address.email);
  });
});

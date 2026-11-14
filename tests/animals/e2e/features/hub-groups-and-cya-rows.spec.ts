import { test, expect } from '@fixtures';
import { IMPORT_REASON_TASK } from '@domain/animals/constants/import-reason-page';
import { speciesCardTitle } from '@domain/animals/constants/commodity-lines';
import {
  ALL_ANSWERS_WITHOUT_DOCUMENT,
  CPH_NUMBER,
  MANDATORY_ANSWERS,
  type NotificationAnswers,
} from '@domain/animals/constants/journey-options';
import { MANDATORY_COMMODITY_LINES } from '@domain/animals/constants/journey-commodity-line-answers';

const ABOUT_GOODS_AND_TRANSPORT = ['1. About the consignment', '2. Description of the goods', '3. Transport and arrival'];
const CONTACT_ADDRESS_SECTION = '6. Contact address';

const REVIEW_SECTION_HEADINGS = [
  ...ABOUT_GOODS_AND_TRANSPORT,
  '4. Uploaded documents',
  '5. Consignment addresses',
  CONTACT_ADDRESS_SECTION,
];

const HUB_SECTION_CAPTIONS = [...ABOUT_GOODS_AND_TRANSPORT, '4. Documents', '5. Consignment parties', CONTACT_ADDRESS_SECTION];

test.describe('Hub groups and check-your-answers rows', { tag: '@duplicated-in-frontend' }, () => {
  test('the hub groups its tasks under the six numbered group headings, with nothing after them', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();

    await expect(animalsPages.overview.taskListHeading).toBeVisible();

    await expect(animalsPages.overview.numberedSectionHeadings).toHaveText(HUB_SECTION_CAPTIONS);

    await expect(animalsPages.overview.buttons).toHaveText(['Review and submit', 'Return to dashboard']);

    await expect(animalsPages.overview.sectionRegions).toHaveCount(HUB_SECTION_CAPTIONS.length);
    for (const [index, caption] of HUB_SECTION_CAPTIONS.entries()) {
      await expect(animalsPages.overview.sectionRegions.nth(index)).toHaveAccessibleName(caption);
    }
    const [aboutTheConsignment, descriptionOfTheGoods, transportAndArrival, documents, consignmentParties, contactAddress] =
      HUB_SECTION_CAPTIONS;
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(aboutTheConsignment)).toHaveText([
      'Where is this consignment coming from?',
      'What are you importing?',
      IMPORT_REASON_TASK,
    ]);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(descriptionOfTheGoods)).toHaveText([
      'Commodity details',
      'Additional details',
    ]);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(transportAndArrival)).toHaveText(['Arrival details', 'Transport details']);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(documents)).toHaveText(['Upload documents']);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(consignmentParties)).toHaveText(['Roles and addresses']);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(contactAddress)).toHaveText(['Contact address for this consignment']);
  });

  test('the hub marks its commodity totals as two named regions inside the Your commodities region', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();

    const totals = animalsPages.overview.commodityTotalsRegion.getByRole('region');
    await expect(totals).toHaveCount(2);
    await expect(totals.nth(0)).toHaveAccessibleName('Animals summary');
    await expect(totals.nth(1)).toHaveAccessibleName('Packages summary');
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
    await expect(pages.page.getByRole('heading', { level: 2 }).filter({ hasText: /^\d\.\s/ })).toHaveText(REVIEW_SECTION_HEADINGS);
    await expect(animalsPages.notificationView.summaryCard('Uploaded documents')).toContainText('You have not added any documents yet.');
    await expect(animalsPages.notificationView.changeLink('Change uploaded documents')).toBeVisible();

    await expect(pages.page.getByRole('heading', { level: 3 })).toHaveText([
      'Origin of import',
      'Main import reason',
      speciesCardTitle(cowLine.species),
      'Additional details',
      'Arrival details',
      'Transport details',
      'Uploaded documents',
      'Addresses',
      'Contact address',
    ]);

    const originOfImport = animalsPages.notificationView.summaryCard('Origin of import');
    await expect(animalsPages.notificationView.summaryValue(originOfImport, 'Country of origin')).toHaveText(answers.countryCode.display);
    await expect(animalsPages.notificationView.summaryKeys(originOfImport)).toHaveText([
      'Country of origin',
      'Region of origin code',
      'Internal reference number',
    ]);
    await expect(animalsPages.notificationView.regionOfOriginCode).toHaveText(`${answers.countryCode.value}-${answers.regionCode}`);
    await expect(animalsPages.notificationView.summaryValue(originOfImport, 'Internal reference number')).toHaveText(
      answers.internalReference,
    );

    const additionalDetails = animalsPages.notificationView.summaryCard('Additional details');
    await expect(animalsPages.notificationView.summaryValue(additionalDetails, 'Certified for')).toHaveText(answers.certifiedFor.display);
    await expect(animalsPages.notificationView.summaryValue(additionalDetails, 'Includes unweaned animals')).toHaveText('No');
    await expect(additionalDetails.getByRole('link', { name: 'Change additional details' })).toBeVisible();

    const mainImportReason = animalsPages.notificationView.summaryCard('Main import reason');
    await expect(animalsPages.notificationView.summaryValue(mainImportReason, 'Main import reason')).toHaveText(
      answers.importReason.display,
    );
    await expect(animalsPages.notificationView.summaryValue(mainImportReason, 'Purpose in the market')).toHaveText(
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
    const { earTag, passportNumber, tattoo } = cowLine;
    expect(earTag).toBeDefined();
    expect(passportNumber).toBeDefined();
    expect(tattoo).toBeDefined();
    await expect(speciesCard.getByRole('cell', { name: earTag, exact: true })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: passportNumber, exact: true })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: tattoo, exact: true })).toBeVisible();

    const arrivalDetails = animalsPages.notificationView.summaryCard('Arrival details');
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Port of entry')).toHaveText(answers.pointOfEntry.display);
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Arrival date at destination')).toHaveText(answers.arrivalDate);
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Means of transport to the port of entry')).toHaveText(
      answers.meansOfTransport.display,
    );
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Transport identification')).toHaveText(
      answers.transportIdentification,
    );
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Transport document reference')).toHaveText(
      answers.transportDocumentReference,
    );

    await expect(
      animalsPages.notificationView.summaryValue(arrivalDetails, 'Countries that the consignment will travel through'),
    ).toHaveText(answers.transitedCountries.map(({ display }) => display).join(', '));
    await expect(arrivalDetails.getByRole('heading', { level: 4, name: 'Transit countries' })).toBeVisible();
    await expect(arrivalDetails.getByRole('link', { name: 'Change transit countries' })).toBeVisible();

    const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
    await expect(animalsPages.notificationView.summaryKeys(transportDetails)).toHaveText([
      'Name',
      'Address',
      'Country',
      'Approval number',
      'Type',
    ]);
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Name')).toContainText(answers.transporter.display);
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Address')).toContainText(answers.transporter.addressLine1);
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Country')).toHaveText(answers.transporter.country);
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Approval number')).toHaveText(
      answers.transporter.approvalNumber,
    );
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Type')).toHaveText('Commercial');

    const addresses = animalsPages.notificationView.summaryCard('Addresses');
    await expect(animalsPages.notificationView.summaryValue(addresses, 'Place of origin')).toContainText(answers.parties.placeOfOrigin);
    await expect(animalsPages.notificationView.summaryValue(addresses, 'Consignor')).toContainText(answers.parties.consignor);
    await expect(animalsPages.notificationView.summaryValue(addresses, 'Consignee')).toContainText(answers.parties.consignee);
    await expect(animalsPages.notificationView.summaryValue(addresses, 'Importer')).toContainText(answers.parties.importer);
    await expect(animalsPages.notificationView.summaryValue(addresses, 'Place of destination')).toContainText(
      answers.parties.placeOfDestination,
    );
    await expect(animalsPages.notificationView.summaryValue(addresses, 'County parish holding (CPH) number')).toHaveText(CPH_NUMBER);

    const contactAddress = animalsPages.notificationView.summaryCard('Contact address');
    await expect(animalsPages.notificationView.summaryValue(contactAddress, 'Contact address')).toContainText(answers.contactAddress);
  });

  test('a road notification with no transit countries and no region of origin code needed reads Not applicable and continues to the declaration', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.toReview(MANDATORY_ANSWERS);

    const [cattleLine] = MANDATORY_ANSWERS.commodityLines;
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 3 })).toHaveText([
      'Origin of import',
      'Main import reason',
      speciesCardTitle(cattleLine.species),
      'Additional details',
      'Arrival details',
      'Transport details',
      'Uploaded documents',
      'Addresses',
      'Contact address',
    ]);

    const originOfImport = animalsPages.notificationView.summaryCard('Origin of import');
    await expect(animalsPages.notificationView.summaryKeys(originOfImport)).toHaveText([
      'Country of origin',
      'Region of origin code',
      'Internal reference number',
    ]);
    await expect(animalsPages.notificationView.summaryValue(originOfImport, 'Region of origin code')).toHaveText('Not applicable');

    await expect(pages.page.getByText('Complete transit countries')).toHaveCount(0);
    await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);

    await animalsPages.notificationView.continueButton.click();
    await expect(animalsPages.declaration.heading).toBeVisible();
  });

  test('the Addresses card shows a cat’s saved permanent address, keyed by its common name and number', async ({
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

    const addresses = animalsPages.notificationView.summaryCard('Addresses');
    const { permanentAddress: address } = MANDATORY_COMMODITY_LINES.domesticCat;
    const permanentAddressRow = animalsPages.notificationView.summaryValue(addresses, `${commonName} 1`);
    await expect(permanentAddressRow).toContainText(address.nameOrOrganisationName);
    await expect(permanentAddressRow).toContainText(address.addressLine1);
    await expect(permanentAddressRow).toContainText(address.townOrCity);
    await expect(permanentAddressRow).toContainText(address.postcode);
    await expect(permanentAddressRow).toContainText('United Kingdom');
    await expect(permanentAddressRow).toContainText(address.phone);
    await expect(permanentAddressRow).toContainText(address.email);
  });
});

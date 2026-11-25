import { AnimalsDynamicsClient } from '@adapters/http/animals-dynamics-client';
import { formattedValue } from '@adapters/http/dataverse-client';
import { dynamicsBaseTestTimeoutMs } from '@config/dynamics';
import { ALL_ANSWERS, CPH_NUMBER, MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { test, expect } from '@fixtures';
import { waitForAnimalsDynamicsNotification } from '@utils/dynamics/animals-polls';
import { skipIfComposeEnvironment } from '@utils/playwright/environment';
import { setTestTimeout } from '@utils/playwright/test-timeout';

// Traces record APIRequestContext calls with their headers and form bodies: the bearer token and client secret.
// Top level because Playwright rejects test.use({ trace }) inside a describe group.
test.use({ trace: 'off' });

test.describe('notification data is stored in PIMS Dynamics', { tag: '@dynamics' }, () => {
  test.beforeEach(() => {
    skipIfComposeEnvironment('the compose stack has no PIMS Dynamics');
  });

  test('the species names, party postcodes, phones and emails, CPH number, transport document and identification, reason for import, internal market purpose, certified for, number of animals and ear tag are stored in PIMS Dynamics', async ({
    animalsJourney,
    journeyContext,
    externalRequest,
    addressBookApi,
  }) => {
    test.fixme(
      true,
      'PIMS Dynamics leaves these mandatory answers empty; the field mapping and likely causes are in the workspace docs/analysis/pims-dynamics-field-gaps.md',
    );
    setTestTimeout(dynamicsBaseTestTimeoutMs);
    test.slow();
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    const answers = MANDATORY_ANSWERS;
    const [cowLine] = answers.commodityLines;
    const consignor = await addressBookApi.findByName(answers.parties.consignor);
    const destination = await addressBookApi.findByName(answers.parties.placeOfDestination);
    const placeOfOrigin = await addressBookApi.findByName(answers.parties.placeOfOrigin);
    const consignee = await addressBookApi.findByName(answers.parties.consignee);
    const importer = await addressBookApi.findByName(answers.parties.importer);
    await animalsJourney.submitNotification(answers);
    const row = await waitForAnimalsDynamicsNotification(dynamics, journeyContext.referenceNumber);

    expect.soft(row.defraimp_commodityspeciesname, 'species name').toBe(cowLine.species.latinName);
    expect.soft(row.defraimp_commodityspeciescommonname, 'species common name').toBe(cowLine.species.commonName);
    expect.soft(row.defraimp_consignoraddresspostalzipcode, 'consignor postcode').toBe(consignor.postcode);
    expect.soft(row.defraimp_consignoraddresstelephone, 'consignor phone').toBe(consignor.phone);
    expect.soft(row.defraimp_consignoraddressemail, 'consignor email').toBe(consignor.email);
    expect.soft(row.defraimp_placeofdestinationaddresspostalzipcode, 'place of destination postcode').toBe(destination.postcode);
    expect.soft(row.defraimp_placeofdestinationaddresstelephone, 'place of destination phone').toBe(destination.phone);
    expect.soft(row.defraimp_placeofdestinationaddressemail, 'place of destination email').toBe(destination.email);
    expect.soft(row.defraimp_placeoforiginpostcode, 'place of origin postcode').toBe(placeOfOrigin.postcode);
    expect.soft(row.defraimp_placeoforiginphone, 'place of origin phone').toBe(placeOfOrigin.phone);
    expect.soft(row.defraimp_placeoforiginemail, 'place of origin email').toBe(placeOfOrigin.email);
    expect.soft(row.defraimp_consigneeaddresspostalzipcode, 'consignee postcode').toBe(consignee.postcode);
    expect.soft(row.defraimp_consigneeaddresstelephone, 'consignee phone').toBe(consignee.phone);
    expect.soft(row.defraimp_consigneeaddressemail, 'consignee email').toBe(consignee.email);
    expect.soft(row.defraimp_importeraddresspostalzipcode, 'importer postcode').toBe(importer.postcode);
    expect.soft(row.defraimp_importeraddresstelephone, 'importer phone').toBe(importer.phone);
    expect.soft(row.defraimp_importeraddressemail, 'importer email').toBe(importer.email);
    expect.soft(row.defraimp_cphnumber, 'CPH number').toBe(CPH_NUMBER);
    expect.soft(row.defraimp_meansoftransporttoentrypointdocument, 'transport document reference').toBe(answers.transportDocumentReference);

    expect.soft(formattedValue(row, 'defraimp_purposeofconsignment'), 'reason for import').toBe(answers.importReason.display);
    expect
      .soft(formattedValue(row, 'defraimp_commoditiesinternalmarketpurpose'), 'internal market purpose')
      .toBe(answers.internalMarketPurpose.display);
    expect.soft(formattedValue(row, 'defraimp_commoditiescertifiedfor'), 'certified for').toBe(answers.certifiedFor.display);

    expect.soft(row.defraimp_commoditiesnumberofanimals, 'number of animals').toBe(cowLine.noOfAnimals);
    expect.soft(row.defraimp_identificationofanimalstext, 'ear tag').toContain(cowLine.earTag);
    expect.soft(row.defraimp_meansoftransporttoentrypointid, 'transport identification').toBe(answers.transportIdentification);
  });

  test('the region of origin code, transited countries, number of packages and passport number are stored in PIMS Dynamics', async ({
    animalsJourney,
    journeyContext,
    externalRequest,
  }) => {
    test.fixme(
      true,
      'PIMS Dynamics leaves these optional answers empty; the field mapping and likely causes are in the workspace docs/analysis/pims-dynamics-field-gaps.md',
    );
    setTestTimeout(dynamicsBaseTestTimeoutMs);
    test.slow();
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    const answers = ALL_ANSWERS;
    const [cowLine] = answers.commodityLines;
    await animalsJourney.submitNotification(answers);
    const row = await waitForAnimalsDynamicsNotification(dynamics, journeyContext.referenceNumber);

    expect.soft(row.defraimp_commoditiesregionoforigin, 'region of origin code').toContain(answers.regionCode);

    for (const country of answers.transitedCountries) {
      expect.soft(row.defraimp_routetransitingstates, `transited country ${country.display}`).toContain(country.value);
    }

    expect.soft(row.defraimp_commoditiesnumberofpackages, 'number of packages').toBe(cowLine.noOfPackages);
    expect.soft(row.defraimp_identificationofanimalstext, 'passport number').toContain(cowLine.passportNumber);
  });
});

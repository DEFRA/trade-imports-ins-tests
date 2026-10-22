import { AnimalsDynamicsClient } from '@adapters/http/animals-dynamics-client';
import { formattedValue } from '@adapters/http/dataverse-client';
import { animalsDynamics } from '@config/animals-dynamics';
import { ALL_ANSWERS, MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import type { AnimalsDynamicsImporterNotification } from '@domain/animals/models/dynamics/importer-notification';
import { test, expect } from '@fixtures';
import { annotateDuration } from '@utils/playwright/annotate-duration';
import { skipIfComposeEnvironment } from '@utils/playwright/environment';

// Answers PIMS Dynamics does not store yet are asserted in notification-data-gaps.spec.ts. Each has a comment in its
// place below, led by its likely cause in square brackets (the causes are defined in that file), so moving its
// assertion here when PIMS stores it keeps the answers in journey order.

// Traces record APIRequestContext calls with their headers and form bodies: the bearer token and client secret.
// Top level because Playwright rejects test.use({ trace }) inside a describe group.
test.use({ trace: 'off' });

/** The journey types the date as d/m/yyyy; PIMS Dynamics returns an ISO date. */
const toIsoDate = (dayMonthYear: string): string => {
  const [day, month, year] = dayMonthYear.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/** The whole row, so a run shows the real lookups, option-set labels, dates and values to assert against. */
const attachRow = (row: AnimalsDynamicsImporterNotification): Promise<void> =>
  test.info().attach('pims-row.json', { body: JSON.stringify(row, null, 2), contentType: 'application/json' });

test.describe('PIMS Dynamics notification data', { tag: '@dynamics' }, () => {
  test.beforeEach(() => {
    skipIfComposeEnvironment('the compose stack has no PIMS Dynamics');
    // The slowed UI journey plus the PIMS Dynamics poll.
    test.slow();
    test.setTimeout(test.info().timeout + animalsDynamics.arrivalTimeoutMs);
  });

  test('a notification submitted with only the mandatory answers is stored in PIMS Dynamics with each of them and no optional ones', async ({
    animalsJourney,
    journeyContext,
    externalRequest,
  }) => {
    // Built first: a missing ANIMALS_DYNAMICS_URL / DATAVERSE_* secret fails here, before the journey.
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    const answers = MANDATORY_ANSWERS;
    await animalsJourney.submitNotification(answers);
    const referenceNumber = journeyContext.referenceNumber;

    await annotateDuration(animalsDynamics.submissionPollAnnotation, () =>
      expect
        .poll(
          () => dynamics.findNotifications(referenceNumber),
          animalsDynamics.pollOptions(`Expected exactly one notification for ${referenceNumber}`),
        )
        .toHaveLength(1),
    );

    // No columns requested, so the whole row comes back.
    const [row] = await dynamics.findNotifications(referenceNumber);
    await attachRow(row);

    // Each mandatory answer, in the order MandatoryAnswers declares them.
    expect.soft(row.defraimp_name, 'reference number').toBe(referenceNumber);
    expect.soft(formattedValue(row, '_defraimp_countryoforiginid_value'), 'country of origin').toBe(answers.countryCode.display);
    // answers.requiresRegionCode: not on this row, it is a journey flag.
    // answers.species: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test (species name and common name).
    // answers.noOfAnimals: [FROM v0.1.0: NOT MAPPED?] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.earTag: [FROM v0.1.0: NOT MAPPED?] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.importReason: [FROM v0.1.0: OPTION NOT MATCHED?] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.internalMarketPurpose: [FROM v0.1.0: NOT IN MESSAGE] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.certifiedFor: [FROM v0.1.0: OPTION NOT MATCHED?] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.unweanedAnimals: PIMS also defaults this to false, so the assertion proves the answer arrived only for an unweaned consignment.
    expect.soft(row.defraimp_commoditiesincludenonablactedanimals, 'unweaned animals').toBe(false);
    expect.soft(row.defraimp_consignorcompanyname, 'consignor').toBe(answers.parties.consignor);
    expect.soft(row.defraimp_placeofdestinationcompanyname, 'place of destination').toBe(answers.parties.placeOfDestination);
    expect.soft(row.defraimp_placeoforigincompanyname, 'place of origin').toBe(answers.parties.placeOfOrigin);
    expect.soft(row.defraimp_consigneecompanyname, 'consignee').toBe(answers.parties.consignee);
    expect.soft(row.defraimp_importercompanyname, 'importer').toBe(answers.parties.importer);
    // answers.cph: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    expect.soft(row.defraimp_arrivaldate?.slice(0, 10), 'arrival date').toBe(toIsoDate(answers.arrivalDate));
    expect.soft(row.defraimp_portofentry, 'point of entry').toBe(answers.pointOfEntry.value);
    expect.soft(row.defraimp_meansoftransporttoentrypointtype, 'means of transport').toBe(answers.meansOfTransport.display);
    // answers.transportIdentification: [FROM v0.1.0: NOT MAPPED?] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.transportDocumentReference: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    expect.soft(row.defraimp_transportercompanyname, 'transporter').toBe(answers.transporter.display);
    // answers.contactAddress: [FROM v0.3.0] see 'mandatory answers PIMS Dynamics does not store yet' test.

    // The optional answers left blank, only in columns that neither PIMS nor the gateway can fill in by default.
    expect.soft(row.defraimp_commoditiesregionoforigin, 'region of origin code').toBeNull();
    expect.soft(row.defraimp_traderreference, 'internal reference').toBeNull();
    expect.soft(row.defraimp_commoditiesnumberofpackages, 'number of packages').toBeNull();
    expect.soft(row.defraimp_routetransitingstates, 'transited countries').toBeNull();
  });

  test('a notification submitted with every answer is stored in PIMS Dynamics with each optional one', async ({
    animalsJourney,
    journeyContext,
    externalRequest,
  }) => {
    // The accompanying document is uploaded and virus-scanned before the journey can submit.
    test.setTimeout(test.info().timeout + 2 * 60_000);
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    const answers = ALL_ANSWERS;
    await animalsJourney.submitNotification(answers);
    const referenceNumber = journeyContext.referenceNumber;

    await annotateDuration(animalsDynamics.submissionPollAnnotation, () =>
      expect
        .poll(
          () => dynamics.findNotifications(referenceNumber),
          animalsDynamics.pollOptions(`Expected exactly one notification for ${referenceNumber}`),
        )
        .toHaveLength(1),
    );

    const [row] = await dynamics.findNotifications(referenceNumber);
    await attachRow(row);

    // Only what ALL_ANSWERS adds to the mandatory answers, which the first test covers, in the order OptionalAnswers
    // declares them, which is the order the journey asks them.
    // answers.requiresRegionCode: not on this row, it is a journey flag.
    // answers.regionCode: [FROM v0.3.0] see 'optional answers PIMS Dynamics does not store yet' test.
    expect.soft(row.defraimp_traderreference, 'internal reference').toBe(answers.internalReference);
    // answers.noOfPackages: [FROM v0.1.0: NOT MAPPED?] see 'optional answers PIMS Dynamics does not store yet' test.
    // answers.passportNumber: [FROM v0.1.0: NOT MAPPED?] see 'optional answers PIMS Dynamics does not store yet' test.
    // answers.transitedCountries: [FROM v0.2.0] see 'optional answers PIMS Dynamics does not store yet' test.
    // answers.accompanyingDocument: [FROM v0.2.0] see 'optional answers PIMS Dynamics does not store yet' test.
  });
});

import { AnimalsDynamicsClient } from '@adapters/http/animals-dynamics-client';
import { formattedValue } from '@adapters/http/dataverse-client';
import { animalsDynamics } from '@config/animals-dynamics';
import { ALL_ANSWERS, CPH_NUMBER, MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { test, expect } from '@fixtures';
import { annotateDuration } from '@utils/playwright/annotate-duration';
import { skipIfComposeEnvironment } from '@utils/playwright/environment';

// The answers notification-data.spec.ts cannot assert yet, because PIMS Dynamics leaves their columns empty. There is one
// test for the mandatory answers and one for the optional ones. Each is skipped and holds the assertions we expect,
// grouped by cause in the order of the legend below, and in journey order within each group. When a column fills, move
// its assertion to its placeholder in notification-data.spec.ts, which keeps the answers in journey order, and delete
// the skip once the test is empty. The expected texts for choices from a fixed list are the journey's display text
// until the values PIMS accepts are agreed.
//
// Each group of assertions is headed by the likely cause of its gap. Each assertion has the GBN-AG path it comes from
// above it. An answer travels like this, and can be lost at any step:
//
//   animals backend --> outbox event --> SQS --> gateway --> v0.1.0 message --> PIMS (live in the TST environment today)
//                       (GBN-AG shape)                  \--> v0.2.0 message --> PIMS
//                                                       \--> v0.3.0 message --> PIMS (planned, not emitted yet)
//
// The words used below:
//   event       the backend's record of the submission (owned by the animals backend)
//   message     what the gateway builds from the event and sends to PIMS: v0.1.0, v0.2.0 or v0.3.0 (owned by the gateway)
//   key         the text saved for a choice, passed from the frontend through the event into the message
//               (e.g. internalMarket)
//   column      a field on the PIMS record (owned by PIMS)
//   option set  a column's own fixed choices in PIMS, each with a number and a label (owned by PIMS)
//
// Assumed, until the PIMS team confirms it: PIMS reads one message version at a time, and in the TST environment
// today that is v0.1.0. When it switches to v0.2.0 it stops reading v0.1.0. Each message version carries every
// answer of the one before it, so an answer tagged FROM v0.1.0 is still carried after the switch. The tags are a
// ladder of what has to happen before PIMS can fill the column:
//
//   [NOT IN SCHEMA]                     no message version defines it, planned or published
//   [FROM v0.3.0]                       first carried by the v0.3.0 message, which is planned and not published yet
//   [FROM v0.2.0]                       first carried by the v0.2.0 message; PIMS has to start reading it
//   [FROM v0.1.0: NOT IN MESSAGE]       the v0.1.0 schema allows it, but the event or the message lacks it (the backend
//                                       or gateway owns the fix, as noted per answer; no new schema version needed)
//   [FROM v0.1.0: OPTION NOT MATCHED?]  a choice from a fixed list (e.g. reason for import): the message carries our
//                                       key, but the column's option set may have no entry for it (the planned v0.3.0
//                                       value lists are meant to settle the keys we send)
//   [FROM v0.1.0: NOT MAPPED?]          typed text or a number (e.g. number of animals): the message carries it, but the
//                                       column is empty, so PIMS may not map it or may store it somewhere else

// Traces record APIRequestContext calls with their headers and form bodies: the bearer token and client secret.
// Top level because Playwright rejects test.use({ trace }) inside a describe group.
test.use({ trace: 'off' });

test.describe('PIMS Dynamics notification data not stored yet', { tag: '@dynamics' }, () => {
  test.beforeEach(() => {
    skipIfComposeEnvironment('the compose stack has no PIMS Dynamics');
    // The slowed UI journey plus the PIMS Dynamics poll.
    test.slow();
    test.setTimeout(test.info().timeout + animalsDynamics.arrivalTimeoutMs);
  });

  test('mandatory answers PIMS Dynamics does not store yet', async ({ animalsJourney, journeyContext, externalRequest }) => {
    test.fixme(true, 'PIMS Dynamics leaves these mandatory answers empty; the likely cause of each is in the comments');
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
    const [row] = await dynamics.findNotifications(referenceNumber);

    // [NOT IN SCHEMA]
    // None yet.

    // [FROM v0.3.0]
    // exchangedDocument.issuer.postalAddress. The schema has no separate contact-address field, so the contact address
    // shares this slot with the Responsible Person for Load, which PIMS stores in its person-responsible columns. The
    // column asserted here is a guess.
    // The backend puts a null issuer in the event today. The planned v0.3.0 message is meant to carry it, but that schema
    // does not exist yet, and neither published schema defines the issuer.
    expect.soft(row.defraimp_personresponsibleaddress, 'contact address').toContain(answers.contactAddress);

    // [FROM v0.2.0]
    // specifiedConsignment.includedConsignmentItem[].includedTradeLineItem[].scientificName and commonName.
    // The event carries both. The v0.1.0 message never included the species names (the gateway's v0.1.0 mapper copies
    // only the classification, quantities, packages and identifiers of a trade line), and the v0.2.0 message carries
    // them, so PIMS can only fill the columns once it reads v0.2.0.
    expect.soft(row.defraimp_commodityspeciesname, 'species name').toBe(answers.species.display);
    expect.soft(row.defraimp_commodityspeciescommonname, 'species common name').toBe(answers.species.commodity.display);
    // specifiedConsignment.finalDestinationLocation.identifier, the CPH number.
    // The event carries it. The v0.1.0 message never included a destination location (of its locations, the gateway's
    // v0.1.0 mapper copies only the port of entry), and the v0.2.0 message carries it, so PIMS can only fill the column
    // once it reads v0.2.0.
    expect.soft(row.defraimp_cphnumber, 'CPH number').toBe(CPH_NUMBER);
    // specifiedConsignment.mainCarriageLogisticsTransportMovement[].transportContractRelatedReferencedDocument[], the transport document.
    // The event carries it. The v0.1.0 message never included the movement's documents (the gateway's v0.1.0 mapper
    // copies only the mode, the transport means name and the arrival time), and the v0.2.0 message carries them, so
    // PIMS can only fill the column once it reads v0.2.0.
    expect.soft(row.defraimp_meansoftransporttoentrypointdocument, 'transport document reference').toBe(answers.transportDocumentReference);

    // [FROM v0.1.0: NOT IN MESSAGE]
    // exchangedDocument.firstSignatoryAuthentication.includedClause[] where identifier is INTERNAL_MARKET_PURPOSE.
    // The backend never puts this clause in the event today (it compares the reason against the wrong key and leaves the
    // content null), although both published schemas allow it. A backend fix puts it in the event; no new schema
    // version is needed.
    expect
      .soft(formattedValue(row, 'defraimp_commoditiesinternalmarketpurpose'), 'internal market purpose')
      .toBe(answers.internalMarketPurpose.display);

    // [FROM v0.1.0: OPTION NOT MATCHED?]
    // The same clauses where identifier is PURPOSE, the reason for import.
    // The event carries the frontend's key (e.g. internalMarket) and both messages pass it on. The column appears to
    // have an option set and stays empty, so the option set may have no entry for our key. The planned v0.3.0 value
    // lists are meant to settle the keys we send; PIMS then has to match them to its option set.
    expect.soft(formattedValue(row, 'defraimp_purposeofconsignment'), 'reason for import').toBe(answers.importReason.display);
    // The same clauses where identifier is GOODS_CERTIFIED_AS, certified for.
    // The event carries the frontend's key (e.g. slaughter) and both messages pass it on, and
    // defraimp_commoditiesanimalscertifiedas is empty too. The same planned v0.3.0 value lists apply.
    expect.soft(formattedValue(row, 'defraimp_commoditiescertifiedfor'), 'certified for').toBe(answers.certifiedFor.display);

    // [FROM v0.1.0: NOT MAPPED?]
    // specifiedConsignment.includedConsignmentItem[].includedTradeLineItem[].specifiedLineTradeDelivery[].productUnitQuantity.content,
    // the number of animals.
    // The event carries it and both messages pass it on, but the column is empty. PIMS may not map it, or may store it
    // per species elsewhere. No planned change covers it, so ask the PIMS team where it lands.
    expect.soft(row.defraimp_commoditiesnumberofanimals, 'number of animals').toBe(answers.noOfAnimals);
    // specifiedConsignment.includedConsignmentItem[].includedTradeLineItem[].individualTradeProductInstance[].identifier[]
    // where typeCode is EAR_TAG, the ear tag.
    // The event carries it and both messages pass it on, but the row's identification text column is empty. PIMS confirmed
    // a per-animal identifier table, which this test does not query, so the ear tag may be there. If so, this assertion
    // belongs against that table and is not waiting on a fix. Ask the PIMS team where it lands.
    expect.soft(row.defraimp_identificationofanimalstext, 'ear tag').toContain(answers.earTag);
    // specifiedConsignment.mainCarriageLogisticsTransportMovement[].usedLogisticsTransportMeans.name, the transport
    // identification. The event leaves the movement's own identifier null.
    // Both messages pass the name on, but the column is empty. No planned change covers it, so ask the PIMS team where
    // it lands. The v0.1.0 schema says the identification will move to the movement's identifier in a later version.
    expect.soft(row.defraimp_meansoftransporttoentrypointid, 'transport identification').toBe(answers.transportIdentification);
  });

  test('optional answers PIMS Dynamics does not store yet', async ({ animalsJourney, journeyContext, externalRequest }) => {
    test.fixme(true, 'PIMS Dynamics leaves these optional answers empty; the likely cause of each is in the comments');
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

    // [NOT IN SCHEMA]
    // None yet.

    // [FROM v0.3.0]
    // specifiedConsignment.originCountry.regionOfOriginCode, the region of origin code. Whether the origin needs one is a
    // journey flag with no column.
    // The event carries it, but the gateway's messages copy only the country code and the subdivision, and neither
    // published schema defines the region of origin code. The planned v0.3.0 message is meant to carry it, but that
    // schema does not exist yet. The column asserted here is a guess, and whether it holds the code with or without its
    // country prefix is unconfirmed.
    expect.soft(row.defraimp_commoditiesregionoforigin, 'region of origin code').toContain(answers.regionCode);

    // [FROM v0.2.0]
    // specifiedConsignment.transitTradeCountry[], the transited countries.
    // The event carries them. The v0.1.0 message never included transit countries (the gateway's v0.1.0 consignment
    // mapper has no field for them), and the v0.2.0 message carries them, so PIMS can only fill the column once it
    // reads v0.2.0. Whether the column holds country codes or names, and its separator, is unconfirmed.
    for (const country of answers.transitedCountries) {
      expect.soft(row.defraimp_routetransitingstates, `transited country ${country.display}`).toContain(country.value);
    }
    // exchangedDocument.referenceDocument[], the accompanying document's reference, issue date and type.
    // The event carries it. The v0.1.0 message never included reference documents (the gateway's v0.1.0 mapper copies
    // only the document identifier, trader id, status, version, issue time and clauses), and the v0.2.0 message carries
    // them, so PIMS can only store it once it reads v0.2.0. PIMS confirmed a related-documents table, which this test
    // does not query, so there is no assertion yet. The document's URL is a consumer-side concern the schema does not
    // carry.

    // [FROM v0.1.0: NOT IN MESSAGE]
    // None yet.

    // [FROM v0.1.0: OPTION NOT MATCHED?]
    // None yet.

    // [FROM v0.1.0: NOT MAPPED?]
    // specifiedConsignment.includedConsignmentItem[].includedTradeLineItem[].physicalReferencedLogisticsPackage[].itemQuantity,
    // the number of packages.
    // The event carries it and both messages pass it on, but the column is empty. PIMS may not map it, or may store it
    // per species elsewhere. No planned change covers it, so ask the PIMS team where it lands.
    expect.soft(row.defraimp_commoditiesnumberofpackages, 'number of packages').toBe(answers.noOfPackages);
    // specifiedConsignment.includedConsignmentItem[].includedTradeLineItem[].individualTradeProductInstance[].identifier[]
    // where typeCode is PASSPORT, the passport number.
    // The event carries it and both messages pass it on, but the row's identification text column is empty. PIMS confirmed
    // a per-animal identifier table, which this test does not query, so the passport number may be there. If so, this
    // assertion belongs against that table and is not waiting on a fix. Ask the PIMS team where it lands.
    expect.soft(row.defraimp_identificationofanimalstext, 'passport number').toContain(answers.passportNumber);
  });
});

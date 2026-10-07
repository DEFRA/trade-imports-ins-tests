import { AnimalsDynamicsClient } from '@adapters/http/animals-dynamics-client';
import { ANIMALS_DYNAMICS_ARRIVAL_TIMEOUT_MS } from '@config/animals-dynamics';
import { timeouts } from '@config/timeouts';
import { CONSIGNEE_NAME, CONSIGNOR_NAME, IMPORTER_NAME } from '@domain/animals/constants/journey-options';
import { test, expect } from '@fixtures';
import { skipIfComposeEnvironment } from '@utils/playwright/environment';

const dynamicsNotificationPollOptions = (referenceNumber: string) => ({
  message: `Expected exactly one notification for ${referenceNumber} in PIMS Dynamics within ${ANIMALS_DYNAMICS_ARRIVAL_TIMEOUT_MS / 1000}s`,
  timeout: ANIMALS_DYNAMICS_ARRIVAL_TIMEOUT_MS,
  intervals: [timeouts.short],
});

// Traces record APIRequestContext calls with their headers and form bodies: the bearer token and client secret.
// Top level because Playwright rejects test.use({ trace }) inside a describe group.
test.use({ trace: 'off' });

test.describe('PIMS Dynamics notification data', { tag: '@dynamics' }, () => {
  test.beforeEach(() => {
    skipIfComposeEnvironment('the compose stack has no PIMS Dynamics');
    // The slowed UI journey plus the PIMS Dynamics poll.
    test.slow();
    test.setTimeout(test.info().timeout + ANIMALS_DYNAMICS_ARRIVAL_TIMEOUT_MS);
  });

  test('a submitted notification is stored in PIMS Dynamics with the data it was submitted with', async ({
    animalsJourney,
    journeyContext,
    request,
  }) => {
    // Built first: a missing ANIMALS_DYNAMICS_URL / DATAVERSE_* secret fails here, before the journey.
    const dynamics = new AnimalsDynamicsClient(request);
    await animalsJourney.submitNotification();
    const referenceNumber = journeyContext.journeyId;

    await expect.poll(() => dynamics.findNotifications(referenceNumber), dynamicsNotificationPollOptions(referenceNumber)).toHaveLength(1);

    // No columns requested, so the whole row comes back.
    // TODO: assert more columns here as PIMS Dynamics stores them; this is a starting set.
    const [row] = await dynamics.findNotifications(referenceNumber);
    expect.soft(row.defraimp_name).toBe(referenceNumber);
    expect.soft(row.defraimp_importercompanyname).toBe(IMPORTER_NAME);
    expect.soft(row.defraimp_consignorcompanyname).toBe(CONSIGNOR_NAME);
    expect.soft(row.defraimp_consigneecompanyname).toBe(CONSIGNEE_NAME);
  });
});

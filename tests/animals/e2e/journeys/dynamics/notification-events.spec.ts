import { AnimalsDynamicsClient } from '@adapters/http/animals-dynamics-client';
import { ANIMALS_DYNAMICS_ARRIVAL_TIMEOUT_MS, ANIMALS_DYNAMICS_SUBMISSION_DATE_TOLERANCE_MS } from '@config/animals-dynamics';
import { timeouts } from '@config/timeouts';
import { animalsDynamicsStatuses } from '@domain/animals/constants/animals-dynamics-statuses';
import type { AnimalsDynamicsImporterNotification } from '@domain/animals/models/dynamics/importer-notification';
import { test, expect } from '@fixtures';
import { skipIfComposeEnvironment } from '@utils/playwright/environment';

const SUBMISSION_COLUMNS = [
  'defraimp_name',
  'defraimp_status',
  'defraimp_submissiondate',
] as const satisfies readonly (keyof AnimalsDynamicsImporterNotification)[];

const dynamicsNotificationPollOptions = (referenceNumber: string) => ({
  message: `Expected exactly one notification for ${referenceNumber} in PIMS Dynamics within ${ANIMALS_DYNAMICS_ARRIVAL_TIMEOUT_MS / 1000}s`,
  timeout: ANIMALS_DYNAMICS_ARRIVAL_TIMEOUT_MS,
  intervals: [timeouts.short],
});

// Traces record APIRequestContext calls with their headers and form bodies: the bearer token and client secret.
// Top level because Playwright rejects test.use({ trace }) inside a describe group.
test.use({ trace: 'off' });

test.describe('PIMS Dynamics notification events', { tag: '@dynamics' }, () => {
  test.beforeEach(() => {
    skipIfComposeEnvironment('the compose stack has no PIMS Dynamics');
    // The slowed UI journey plus the PIMS Dynamics poll.
    test.slow();
    test.setTimeout(test.info().timeout + ANIMALS_DYNAMICS_ARRIVAL_TIMEOUT_MS);
  });

  test('a submitted notification is created in PIMS Dynamics', async ({ animalsJourney, journeyContext, request }) => {
    // Built first: a missing ANIMALS_DYNAMICS_URL / DATAVERSE_* secret fails here, before the journey.
    const dynamics = new AnimalsDynamicsClient(request);
    await animalsJourney.submitNotification();
    const submittedAt = Date.now();
    const referenceNumber = journeyContext.journeyId;

    await expect
      .poll(
        () => dynamics.findNotificationsScopedToColumns(referenceNumber, SUBMISSION_COLUMNS),
        dynamicsNotificationPollOptions(referenceNumber),
      )
      .toHaveLength(1);

    // expect.poll doesn't return the matched value, so fetch the row once more to check its columns.
    const [row] = await dynamics.findNotificationsScopedToColumns(referenceNumber, SUBMISSION_COLUMNS);
    expect.soft(row.defraimp_name).toBe(referenceNumber);
    expect.soft(row.defraimp_status).toBe(animalsDynamicsStatuses.submitted);
    expect.soft(row.defraimp_submissiondate).not.toBeNull();
    expect
      .soft(Math.abs(Date.parse(row.defraimp_submissiondate ?? '') - submittedAt))
      .toBeLessThan(ANIMALS_DYNAMICS_SUBMISSION_DATE_TOLERANCE_MS);
  });
});

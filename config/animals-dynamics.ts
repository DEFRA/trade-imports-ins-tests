import { expect } from '@playwright/test';
import type { AnimalsDynamicsClient } from '@adapters/http/animals-dynamics-client';
import { timeouts } from '@config/timeouts';
import type { AnimalsDynamicsImporterNotification } from '@domain/animals/models/dynamics/importer-notification';
import { annotateDuration } from '@utils/playwright/annotate-duration';

// Delivery is outbox → SQS → gateway → ASB → PIMS Dynamics.
const arrivalTimeoutMs = timeouts.veryLong;

/** How the animals tests wait on PIMS Dynamics, the animals Dynamics instance, and how they report the wait. */
export const animalsDynamics = {
  arrivalTimeoutMs,

  // PIMS Dynamics stores the backend's submit time, slightly before the test's own; the tolerance also covers clock skew.
  submissionDateToleranceMs: timeouts.medium,

  submissionPollAnnotation: 'PIMS Dynamics submission poll',

  /** `expect.poll` options for waiting on PIMS Dynamics; `expectation` starts the failure message. */
  pollOptions: (expectation: string, timeout: number = arrivalTimeoutMs) => ({
    message: `${expectation} in PIMS Dynamics within ${timeout / 1000}s`,
    timeout,
    intervals: [timeouts.short],
  }),
} as const;

/** Polls PIMS Dynamics until it holds exactly one notification for the reference, then returns that row with all its columns. */
export async function waitForNotificationRow(
  dynamics: AnimalsDynamicsClient,
  referenceNumber: string,
): Promise<AnimalsDynamicsImporterNotification> {
  await annotateDuration(animalsDynamics.submissionPollAnnotation, () =>
    expect
      .poll(
        () => dynamics.findNotifications(referenceNumber),
        animalsDynamics.pollOptions(`Expected exactly one notification for ${referenceNumber}`),
      )
      .toHaveLength(1),
  );
  const [row] = await dynamics.findNotifications(referenceNumber);
  return row;
}

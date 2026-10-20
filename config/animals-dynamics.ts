import { timeouts } from '@config/timeouts';

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

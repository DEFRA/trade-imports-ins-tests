/** PIMS Dynamics is the animals Dynamics instance: its environment URL, table, reference column and delivery timing. */

import { requireEnv } from '@config/dataverse';
import { timeouts } from '@config/timeouts';

export const ANIMALS_DYNAMICS_NOTIFICATIONS_ENTITY_SET = 'defraimp_importernotifications';
export const ANIMALS_DYNAMICS_REFERENCE_COLUMN = 'defraimp_name';

// Delivery is outbox → SQS → gateway → ASB → PIMS Dynamics.
export const ANIMALS_DYNAMICS_ARRIVAL_TIMEOUT_MS = timeouts.veryLong;

// PIMS Dynamics stores the backend's submit time, slightly before the test's own; the tolerance also covers clock skew.
export const ANIMALS_DYNAMICS_SUBMISSION_DATE_TOLERANCE_MS = timeouts.medium;

/** Trailing '/' stripped so the query URL and the token's `resource` match however the secret is typed. */
export const getAnimalsDynamicsUrl = (): string => requireEnv('ANIMALS_DYNAMICS_URL')[0].replace(/\/+$/, '');

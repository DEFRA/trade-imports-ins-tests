import { expect } from '@playwright/test';
import type { AnimalsDynamicsClient } from '@adapters/http/animals-dynamics-client';
import { timeouts } from '@config/timeouts';
import type { AnimalsDynamicsImporterNotification } from '@domain/animals/models/dynamics/importer-notification';
import { annotateDuration } from '@utils/playwright/annotate-duration';

type Notification = AnimalsDynamicsImporterNotification;

/** `expect.poll` options for waiting on PIMS Dynamics; `expectation` starts the failure message. */
export const dynamicsPollOptions = (expectation: string, timeout: number = timeouts.extraLong) => ({
  message: `${expectation} in PIMS Dynamics within ${timeout / 1000}s`,
  timeout,
  intervals: [timeouts.short],
});

/**
 * Polls PIMS Dynamics until it holds exactly one notification for the reference, then returns that row.
 * The row carries all its columns, or only `columns` when they are named.
 */
export async function waitForAnimalsDynamicsNotification<K extends keyof Notification = keyof Notification>(
  dynamics: AnimalsDynamicsClient,
  referenceNumber: string,
  columns?: readonly K[],
): Promise<Pick<Notification, K>> {
  let rows: Pick<Notification, K>[] = [];
  await annotateDuration('PIMS Dynamics submission poll', () =>
    expect
      .poll(
        async () => {
          rows = columns
            ? await dynamics.findNotificationsScopedToColumns(referenceNumber, columns)
            : await dynamics.findNotifications(referenceNumber);
          return rows;
        },
        dynamicsPollOptions(`Expected exactly one notification for ${referenceNumber}`),
      )
      .toHaveLength(1),
  );
  return rows[0];
}

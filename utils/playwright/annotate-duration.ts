import { test } from '@playwright/test';

const minutesAndSeconds = (ms: number): string => {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`;
};

/** Runs `step` and adds how long it took to the test's report annotations under `type`, whether it passed or failed. */
export async function annotateDuration(type: string, step: () => Promise<void>): Promise<void> {
  const startedAt = Date.now();
  let outcome = 'failed after';
  try {
    await step();
    outcome = 'took';
  } finally {
    test.info().annotations.push({ type, description: `${outcome} ${minutesAndSeconds(Date.now() - startedAt)}` });
  }
}

import { test } from '@playwright/test';

const NO_TIMEOUT = 0;

/** Sets the running test's timeout to `totalMs`. A test with no timeout, as in debug mode, keeps having none. */
export function setTestTimeout(totalMs: number): void {
  if (test.info().timeout === NO_TIMEOUT) return;
  test.setTimeout(totalMs);
}

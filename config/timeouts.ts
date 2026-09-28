export const timeouts = {
  veryShort: 1_000,
  short: 5_000,
  medium: 10_000,
  long: 30_000,
} as const;

/** Bound for waiting on the next page's heading or form after a navigation. */
export const pageLoadWait = { timeout: timeouts.long } as const;

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { throwIfProdEnvironment } from './environment';

dotenv.config({ quiet: true });
throwIfProdEnvironment();

/** One project per deployable app; each owns every spec under tests/<name>/. */
export const PROJECT_NAMES = ['animals', 'animals-admin', 'ins', 'plants'] as const;

/**
 * Worker count from PLAYWRIGHT_WORKERS (a positive integer or a percentage such as "50%").
 * Unset keeps the default: 50% on CI, Playwright's own default locally. Invalid values throw.
 */
function resolveWorkers(): number | string | undefined {
  const raw = process.env.PLAYWRIGHT_WORKERS?.trim();
  if (!raw) {
    return process.env.CI ? '50%' : undefined;
  }
  if (/^[1-9]\d*%$/.test(raw)) {
    return raw;
  }
  if (/^[1-9]\d*$/.test(raw)) {
    return Number(raw);
  }
  throw new Error(`Invalid PLAYWRIGHT_WORKERS "${raw}": use a positive integer (e.g. 2) or a percentage (e.g. 50%).`);
}

/**
 * Shared Playwright settings without per-environment baseURLs.
 * Apply project baseURLs via withProjectBaseUrls in environment-specific config files.
 * Import-only — not a runnable Playwright config (avoids VS Code extension discovery).
 */
export default defineConfig({
  testDir: './tests',
  // Path is relative to the env-specific config that spreads this object (repo root).
  globalSetup: './utils/playwright/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: resolveWorkers(),
  reporter: [['list'], ['html', { open: 'never' }], ['allure-playwright'], ['./utils/playwright/failed-suite-reporter.ts']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: PROJECT_NAMES.map((name) => ({
    name,
    testMatch: `**/tests/${name}/**/*.spec.ts`,
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 1000 },
    },
  })),
});

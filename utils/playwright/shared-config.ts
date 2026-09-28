import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { throwIfProdEnvironment } from './environment';

dotenv.config({ quiet: true });
throwIfProdEnvironment();

/** One project per deployable app; each owns every spec under tests/<name>/. */
export const PROJECT_NAMES = ['animals', 'animals-admin', 'ins', 'plants'] as const;

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
  workers: process.env.CI ? '50%' : undefined,
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

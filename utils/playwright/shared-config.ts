import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { throwIfProdEnvironment } from './environment';

dotenv.config({ quiet: true });
throwIfProdEnvironment();

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

  projects: [
    {
      name: 'e2e',
      testIgnore: [
        '**/tests/e2e/features/admin/**/*.spec.ts',
        '**/tests/e2e/pages/admin/**/*.spec.ts',
        '**/tests/a11y/admin/**/*.spec.ts',
        '**/tests/e2e/features/ins/**/*.spec.ts',
        '**/tests/e2e/features/plants/**/*.spec.ts',
        '**/tests/security/admin/**/*.spec.ts',
        '**/tests/security/ins/**/*.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 1000 },
      },
    },
    {
      name: 'admin',
      testMatch: [
        '**/tests/e2e/features/admin/**/*.spec.ts',
        '**/tests/e2e/pages/admin/**/*.spec.ts',
        '**/tests/a11y/admin/**/*.spec.ts',
        '**/tests/security/admin/**/*.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 1000 },
      },
    },
    {
      name: 'ins',
      testMatch: ['**/tests/e2e/features/ins/**/*.spec.ts', '**/tests/security/ins/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 1000 },
      },
    },
    {
      name: 'plants',
      testMatch: ['**/tests/e2e/features/plants/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 1000 },
      },
    },
  ],
});

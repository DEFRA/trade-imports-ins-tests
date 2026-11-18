import { defineConfig } from '@playwright/test';
import dockerComposeConfig from './playwright.docker-compose.config';

/**
 * e2e against the workspace docker-compose stack, in BrowserStack's real browsers and devices.
 * The browser, OS and device of each run come from the platforms in browserstack.yml; the single
 * project here only gives the SDK something to fan out. BrowserStack Local tunnels the stack's localhost URLs.
 * Run through browserstack-node-sdk, never bare `playwright test`.
 */
export default defineConfig({
  ...dockerComposeConfig,
  projects: [{ name: 'chromium' }],
});

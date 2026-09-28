import type { PlaywrightTestConfig } from '@playwright/test';

/**
 * Sets env vars for backend services reached directly by adapters (fetch),
 * bypassing the frontend — e.g. TRADE_IMPORTS_ANIMALS_BACKEND_URL for
 * NotificationApiClient. Unlike frontend/admin base URLs these aren't scoped
 * per Playwright project — a given service has the same URL regardless of
 * which browser project a test runs under. Keyed by env var name so a new
 * service is just another map entry, not a new function.
 */
export function withServiceBaseUrls(config: PlaywrightTestConfig, serviceBaseUrls: Record<string, string>): PlaywrightTestConfig {
  for (const [envVar, baseUrl] of Object.entries(serviceBaseUrls)) {
    if (!baseUrl) {
      throw new Error(`No base URL configured for service env var: ${envVar}`);
    }
    process.env[envVar] = baseUrl;
  }
  return config;
}

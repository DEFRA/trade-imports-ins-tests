import type { PlaywrightTestConfig } from '@playwright/test';
import { zapEnabled, zapPort } from '@config/zap';

// No-ops unless zapEnabled, so other profiles are unaffected. ZAP acts as a
// MITM proxy with its own certs, hence ignoreHTTPSErrors here (scoped to
// this config only). --ignore-certificate-errors is added alongside it:
// ignoreHTTPSErrors alone has known gaps with proxy-issued (MITM) certs in
// Chromium specifically, unlike a normal self-signed/expired cert.
//
// ZAP is always reachable via localhost — only the port varies; see
// config/zap.ts.
export function withZapProxy(config: PlaywrightTestConfig): PlaywrightTestConfig {
  if (!zapEnabled || !Array.isArray(config.projects)) return config;

  return {
    ...config,
    projects: config.projects.map((project) => ({
      ...project,
      use: {
        ...project.use,
        proxy: { server: `http://localhost:${zapPort}` },
        ignoreHTTPSErrors: true,
        launchOptions: {
          ...project.use?.launchOptions,
          args: [...(project.use?.launchOptions?.args ?? []), '--ignore-certificate-errors'],
        },
      },
    })),
  };
}

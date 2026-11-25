import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import dotenv from 'dotenv';
import { parse } from 'yaml';
import { getEnvironment } from '@utils/playwright/environment';

dotenv.config({ quiet: true });

const REQUIRED_CREDENTIALS = ['BROWSERSTACK_USERNAME', 'BROWSERSTACK_ACCESS_KEY'];
const CDP_CONFIG = 'playwright.config.ts';
const DOCKER_COMPOSE_CONFIG = 'playwright.docker-compose.config.ts';
const GLOBAL_REQUIRE_URL = new URL('browserstack-global-require.mjs', import.meta.url).href;
const TEAM_SESSION_LIMIT = 13;

interface BrowserStackConfig {
  projectName: string;
  platforms: unknown[];
}

function assertCredentialsSet(): void {
  const missing = REQUIRED_CREDENTIALS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Set ${missing.join(' and ')} in .env to run on BrowserStack.`);
    process.exit(1);
  }
}

function utcTimestamp(): string {
  return new Date().toISOString().replace(/[-:]|\.\d+/g, '');
}

interface RunSettings {
  name: string;
  identifier: string;
  usesLocalTunnel: boolean;
  playwrightConfig: string;
}

function resolveRunSettings(): RunSettings {
  if (process.env.RUN_ID) {
    return {
      name: `cdp-${getEnvironment() ?? 'unknown'}`,
      identifier: process.env.RUN_ID,
      usesLocalTunnel: true,
      playwrightConfig: CDP_CONFIG,
    };
  }
  const identifier = process.env.GITHUB_RUN_ID;
  return identifier
    ? { name: 'github', identifier, usesLocalTunnel: true, playwrightConfig: DOCKER_COMPOSE_CONFIG }
    : { name: 'local', identifier: utcTimestamp(), usesLocalTunnel: true, playwrightConfig: DOCKER_COMPOSE_CONFIG };
}

function defaultParallelsPerPlatform(platformCount: number): number {
  const sessions = Math.min(availableParallelism(), TEAM_SESSION_LIMIT);
  return Math.max(1, Math.floor(sessions / platformCount));
}

function resolveParallelsPerPlatform(platformCount: number): string {
  const override = process.env.BROWSERSTACK_PARALLELS_PER_PLATFORM;
  if (!override) return String(defaultParallelsPerPlatform(platformCount));
  if (!/^[1-9]\d*$/.test(override)) {
    console.error(`BROWSERSTACK_PARALLELS_PER_PLATFORM must be a positive whole number, not "${override}".`);
    process.exit(1);
  }
  return override;
}

function readBrowserStackConfig(): BrowserStackConfig {
  const configUrl = new URL('../browserstack.yml', import.meta.url);
  const config = parse(readFileSync(configUrl, 'utf8')) as BrowserStackConfig;
  if (!Array.isArray(config.platforms) || config.platforms.length === 0) {
    console.error('browserstack.yml must list at least one platform under platforms.');
    process.exit(1);
  }
  return config;
}

function runSdk(playwrightArgs: string[], parallelsPerPlatform: string): Promise<number> {
  const run = resolveRunSettings();
  console.log(`BrowserStack: ${parallelsPerPlatform} parallel sessions per platform`);
  const sdk = spawn('npx', ['browserstack-node-sdk', 'playwright', 'test', `--config=${run.playwrightConfig}`, ...playwrightArgs], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import ${GLOBAL_REQUIRE_URL}`.trim(),
      BROWSERSTACK_BUILD_NAME: run.name,
      BROWSERSTACK_BUILD_IDENTIFIER: run.identifier,
      BROWSERSTACK_LOCAL: String(run.usesLocalTunnel),
      BROWSERSTACK_PARALLELS_PER_PLATFORM: parallelsPerPlatform,
      E2E_SESSION_REUSE: 'off',
    },
  });
  return new Promise((resolve) => sdk.on('close', (code) => resolve(code ?? 1)));
}

async function main(): Promise<void> {
  assertCredentialsSet();
  const { projectName, platforms } = readBrowserStackConfig();
  process.exitCode = await runSdk(process.argv.slice(2), resolveParallelsPerPlatform(platforms.length));
  console.log(`BrowserStack project: https://automate.browserstack.com/projects/${projectName}`);
}

void main();

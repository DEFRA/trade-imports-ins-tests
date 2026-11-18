import { spawn } from 'node:child_process';
import { cpus } from 'node:os';
import dotenv from 'dotenv';
import { getEnvironment } from '@utils/playwright/environment';

dotenv.config({ quiet: true });

const REQUIRED_CREDENTIALS = ['BROWSERSTACK_USERNAME', 'BROWSERSTACK_ACCESS_KEY'];
// The BrowserStack plan allows 13 parallel sessions, shared by the whole team.
const MAX_DEFAULT_PARALLELS_PER_PLATFORM = 13;

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

interface BuildSettings {
  name: string;
  identifier: string;
  usesLocalTunnel: boolean;
}

function resolveBuildSettings(): BuildSettings {
  if (process.env.RUN_ID) {
    return { name: `cdp-${getEnvironment() ?? 'unknown'}`, identifier: process.env.RUN_ID, usesLocalTunnel: false };
  }
  if (process.env.GITHUB_RUN_ID) {
    return { name: 'github', identifier: process.env.GITHUB_RUN_ID, usesLocalTunnel: true };
  }
  return { name: 'local', identifier: utcTimestamp(), usesLocalTunnel: true };
}

// Half the CPUs, as Playwright's 50% workers, from 1 up to the plan limit.
function defaultParallelsPerPlatform(): number {
  return Math.min(MAX_DEFAULT_PARALLELS_PER_PLATFORM, Math.max(1, Math.floor(cpus().length / 2)));
}

function resolveParallelsPerPlatform(): string {
  const override = process.env.BROWSERSTACK_PARALLELS_PER_PLATFORM;
  if (!override) return String(defaultParallelsPerPlatform());
  if (!/^[1-9]\d*$/.test(override)) {
    console.error(`BROWSERSTACK_PARALLELS_PER_PLATFORM must be a positive whole number, not "${override}".`);
    process.exit(1);
  }
  return override;
}

function runSdk(playwrightArgs: string[]): Promise<number> {
  const build = resolveBuildSettings();
  const parallelsPerPlatform = resolveParallelsPerPlatform();
  console.log(`BrowserStack: ${parallelsPerPlatform} parallel sessions per platform`);
  const sdk = spawn(
    'npx',
    ['browserstack-node-sdk', 'playwright', 'test', '--config=playwright.browserstack.config.ts', ...playwrightArgs],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        BROWSERSTACK_BUILD_NAME: build.name,
        BROWSERSTACK_BUILD_IDENTIFIER: build.identifier,
        BROWSERSTACK_LOCAL: String(build.usesLocalTunnel),
        BROWSERSTACK_PARALLELS_PER_PLATFORM: parallelsPerPlatform,
      },
    },
  );
  return new Promise((resolve) => sdk.on('close', (code) => resolve(code ?? 1)));
}

async function main(): Promise<void> {
  assertCredentialsSet();
  process.exitCode = await runSdk(process.argv.slice(2));
}

void main();

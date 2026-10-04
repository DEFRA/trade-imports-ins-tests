# trade-imports-ins-tests

End-to-end, accessibility and security tests for the trade imports services — the animals frontend and its admin portal, the high-risk plants frontend, and the Import Notification Service front door (including the address book). Tests are split by domain so each service's deploy can run only its own suite.

## Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Editor Setup](#editor-setup)
- [Running Tests](#running-tests)
- [Local Testing](#local-testing)
- [Visual Regression Tests](#visual-regression-tests)
- [Security Testing](#security-testing)
- [Running Tests on GitHub](#running-tests-on-github)
- [Running Tests via CDP Portal](#running-tests-via-cdp-portal)
- [Developer Workflow](#developer-workflow)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)
- [Licence](#licence)

## Prerequisites

- Node.js v24
- npm package manager

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd trade-imports-ins-tests
   ```

2. Use the correct version of Node.js:

   ```bash
   nvm use
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Install Playwright browsers:

   ```bash
   npx playwright install
   ```

   Or install only Chromium (for faster setup):

   ```bash
   npx playwright install chromium
   ```

## Editor Setup

### TypeScript version (VS Code and Cursor)

To keep TypeScript checks and editor behaviour consistent with this repository and CI, use the workspace TypeScript version in your editor:

1. Open any `.ts` or `.tsx` file.
2. Open Command Palette (`Cmd+Shift+P` on macOS).
3. Run `TypeScript: Select TypeScript Version`.
4. Select `Use Workspace Version`.

## Running Tests

This project uses **Playwright Test** as the test runner, with TypeScript for type-safe test development.

| Command                                       | Test scope                                            | Target               | Config                                | Generates Report |
| --------------------------------------------- | ----------------------------------------------------- | -------------------- | ------------------------------------- | ---------------- |
| `npm test`                                    | E2E suite, excluding `@compose` and `@a11y`           | CDP                  | `playwright.config.ts`                | ✓                |
| `npm run test:a11y`                           | Accessibility (`@a11y`) test suite                    | CDP                  | `playwright.config.ts`                | ✓                |
| `npm run test:docker-compose`                 | E2E + E2E integration (`@compose`) test suites        | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:a11y`            | Accessibility (`@a11y`) test suite                    | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:visual`          | Visual regression (`@visual`) suite                   | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:security`        | ZAP passive scan against the e2e suite                | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:security:active` | Security (`@active`, ZAP passive + active scan) suite | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:ci`              | E2E, for the workspace CI stack job                   | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |

### Running one domain

The scripts above run every domain. Against the docker-compose stack, each
domain also has its own scripts, named `test:docker-compose:<domain>[:<suite>]`
to match the [CDP domain profiles](#running-tests-via-cdp-portal). They run
the same suite as the all-domain script, limited to that domain's project.

| Domain          | e2e                                 | a11y                                     | visual                               | security (ZAP passive)                       | security:active (ZAP active, scoped)                |
| --------------- | ----------------------------------- | ---------------------------------------- | ------------------------------------ | -------------------------------------------- | --------------------------------------------------- |
| `animals`       | `test:docker-compose:animals`       | `test:docker-compose:animals:a11y`       | `test:docker-compose:animals:visual` | `test:docker-compose:animals:security`       | `test:docker-compose:animals:security:active`       |
| `animals-admin` | `test:docker-compose:animals-admin` | `test:docker-compose:animals-admin:a11y` | —                                    | `test:docker-compose:animals-admin:security` | `test:docker-compose:animals-admin:security:active` |
| `ins`           | `test:docker-compose:ins`           | —                                        | —                                    | `test:docker-compose:ins:security`           | `test:docker-compose:ins:security:active`           |
| `plants`        | `test:docker-compose:plants`        | —                                        | —                                    | —                                            | —                                                   |

A dash means the domain has no specs for that suite yet.

Per-domain `security:active` sets `ZAP_SCOPE` so the no-traffic gate only covers
that project's ZAP contexts; the report is labelled scoped. Full-corpus active
remains `npm run test:docker-compose:security:active`.

Optional: append these Playwright parameters to the command you're running (e.g. `npm test`) when needed.

| Playwright Parameters      | Action                                     |
| -------------------------- | ------------------------------------------ |
| `-- --headed`              | Run tests in headed mode (see the browser) |
| `-- tests/example.spec.ts` | Run a specific test file                   |
| `-- --grep "@smoke"`       | Run tests with a specific tag              |
| `-- --debug`               | Run tests in debug mode                    |
| `-- --ui`                  | Run tests with UI mode                     |
| `-- --project=animals`     | Run tests in a specific project            |

### Test Reports

| Command                      | Report                 | Generates Report |
| ---------------------------- | ---------------------- | ---------------- |
| `npx playwright show-report` | Open HTML report       | n/a              |
| `npm run report`             | Generate Allure report | ✓                |

After tests run, Playwright results and report are generated automatically, and Allure results are also generated automatically. Run `npm run report` to generate the Allure report.

### Test Configuration

Shared settings (projects, reporters, `retries: 1`, `trace: on-first-retry`)
live in `utils/playwright/shared-config.ts`. The target-specific configs extend
those settings:

| File                                  | Target               |
| ------------------------------------- | -------------------- |
| `playwright.config.ts`                | CDP services         |
| `playwright.docker-compose.config.ts` | docker-compose stack |

`@a11y` tests use the same configs; per-test timeout is longer in
`fixtures/a11y.ts`.

The CDP config sets a 60s test timeout and a 15s expect timeout, against
Playwright's 30s and 5s defaults that the docker-compose config keeps. Each CDP
page load is a real network hop, so CDP needs a longer budget than the local
stack. The suite once also timed out in bursts: a
leaked address book on dev (grown to 4,882 records) made every
`contact-address` page load fan out dozens of concurrent reads through the
CDP SSL sidecar, which returned 502/504s for a few minutes at a time. Session
reuse, a per-test address-book teardown and a one-off purge removed the leak
and the outage; three clean CDP runs then kept every test under
three-quarters of its new budget (45s, or 135s for tests marked
`test.slow()`), so the timeout came down from 90s to 60s.

`documents-limits`' fifteen-document test sets its own 120s timeout: its real
uploads and virus scans take 57–60s on the local stack and about 67s on CDP,
which left too thin a margin under the 90s a slow test gets on compose.
Re-check it if the base timeouts change.

The flow helpers wait for each page's heading with `pageLoadWait`
(`config/timeouts.ts`, 30s) rather than the test timeout, so a transient 502
fails the step that hit it within 30s and names the page it was waiting for.
Sign-in waits for either the landing page or the "Sorry, we are unable to sign
you in." page before deciding whether to try again.

### Address-book records made by a test

Specs do not clean up the addresses they create. Outside prod the address book
removes every address about 7 days after it was created
(`ADDRESS_TTL_DAYS`), so test records age out on their own. Make each name
unique (a timestamp or UUID suffix) so a search finds only this run's record.
A spec deletes an address only when the deletion is what it tests. The shared
journey addresses seeded in `globalSetup` expire too; the next run's
`ensureE2eAddressBook` creates them again.

### Authenticated session reuse

Each worker signs in once per project and its tests restore that session
instead of driving the identity provider every time (`fixtures/auth-state.ts`).
Saved state lives under `playwright/.auth/` (gitignored, removed by `_clean`),
holds only the `sid` auth cookie, and is never written unless a fresh context
has proved it restores to a signed-in landing page. A spec that must start
unauthenticated opts out with `test.use({ storageState: COLD_START })`.

`E2E_SESSION_REUSE=off` is the kill switch: every test signs in for itself
again. The CDP config caps workers at 4 when reuse is off; against the
docker-compose stack re-cap them yourself (e.g. `-- --workers=4`).
Reuse is on by default against both the docker-compose stack and CDP.
`ENVIRONMENT=dev npm run probe:cdp-session-reuse` passed against dev on
2026-09-15 for animals-frontend, admin and ins-frontend — it signs in once per
service and proves load-balanced replicas honour a session minted against
another. Re-run it before relying on reuse against a different CDP
environment.

The `docker-compose` config targets `localhost:3000` / `localhost:3001` /
`localhost:3002` / `localhost:3003`, so start the workspace stack first. CI
runs `npm run test:docker-compose:ci` against that stack via the workspace
reusable workflow.

### Test Projects

Both configs split tests across the same four Playwright projects, one per
deployable app. Each project runs every spec under its own `tests/<project>/`
folder:

| Project         | Service                          | Folder                 |
| --------------- | -------------------------------- | ---------------------- |
| `animals`       | `trade-imports-animals-frontend` | `tests/animals/`       |
| `animals-admin` | `trade-imports-animals-admin`    | `tests/animals-admin/` |
| `ins`           | `trade-imports-ins-frontend`     | `tests/ins/`           |
| `plants`        | `trade-imports-plants-frontend`  | `tests/plants/`        |

Within a project folder, specs are grouped by test type, then by feature:

```text
tests/<project>/
  a11y/
  e2e/
    features/
      address-book/   (animals and ins)
    pages/
    journeys/
    visual/
  security/
```

Folders only organise specs: tags (`@a11y`, `@active`, `@compose`, `@visual`)
select the suite, and the project selects the domain.

## Local Testing

### Local workspace stack

1. From the [workspace root](https://github.com/DEFRA/trade-imports-workspace),
   start the locally built stack:

   ```bash
   ./scripts/stack/run-stack.sh -d
   ```

2. Run every project with `npm run test:docker-compose`, or one domain with
   its own script, e.g. `npm run test:docker-compose:plants` (see
   [Running one domain](#running-one-domain)).

`npm run test:docker-compose` targets the stack animals frontend on :3000, the
admin service on :3001, the ins frontend on :3002 and the high-risk plants
frontend on :3003.

To debug, append Playwright flags, e.g.
`npm run test:docker-compose -- --headed --workers=1`.

The suite does not wipe the database before it runs, and does not need to.
Every spec creates the state it asserts on through the front door (the
backend API), scoped to that run, so the specs pass against a database that
already holds the records of earlier runs.

For the security (OWASP ZAP) profiles against this stack, see
[Security Testing](#security-testing) below.

#### Workspace stack commands (run from the workspace root)

| Command                             | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `./scripts/stack/run-stack.sh`      | Start the full stack from published images             |
| `./scripts/stack/run-stack.sh -d`   | Start the stack built from local source under `repos/` |
| `./scripts/stack/stop-stack.sh`     | Stop the stack and wipe volumes                        |
| `./scripts/stack/bounce-backend.sh` | Recreate the backend container (picks up Java changes) |

See `docker/stack/AGENTS.md` in the workspace for the full flag reference.

### Target CDP environments (from local machine)

To run tests against a CDP environment from your local machine:

1. Set `PLAYWRIGHT_ENVIRONMENT` to one of `dev`, `test`, or `perf-test` in your `.env`.
2. Run tests with `npm test`.

Use `.env.example` as a template.
When running via the CDP Portal, `ENVIRONMENT` is provided by the portal; use `PLAYWRIGHT_ENVIRONMENT` and avoid setting `ENVIRONMENT` locally.

### Capping parallel browsers (`PLAYWRIGHT_WORKERS`)

Set `PLAYWRIGHT_WORKERS` to limit how many browsers Playwright runs at once, because the device is usually the bottleneck. Use a whole number or a percentage, for example `PLAYWRIGHT_WORKERS=2` on a 16 GB machine running the full Docker stack.
If it is not set, Playwright's default applies (50% of cores on CI).

## Visual Regression Tests

Visual regression tests (tagged `@visual`) guard rendered composition — layout, spacing, colour, and typography as the user sees the page. They compare screenshots against committed baseline images and fail if any pixels differ outside the masked regions.

Baselines are stored alongside their spec files in `*-snapshots/` directories and must be committed. Each platform requires its own baseline — update both when visual changes are intentional.

Run against the stack with `npm run test:docker-compose:visual` (or
`test:docker-compose:animals:visual` — only `animals` has `@visual` specs today).

Regenerate the E2E baseline against the stack frontend with
`npm run test:visual:update:macos` for the host-rendered `*-darwin.png` image and
`npm run test:visual:update:linux` for the container-rendered `*-linux.png` image
used by CI. Both commands run the `animals` project's `@visual` suite and write the
updated snapshot into the working tree for commit. Narrow to one spec (or title via
`--grep`) by passing Playwright args after the command:

```bash
npm run test:visual:update:macos -- tests/animals/e2e/visual/origin-of-import.visual.spec.ts
./bin/update-visual-baselines-linux.sh tests/animals/e2e/visual/origin-of-import.visual.spec.ts
```

## Security Testing

Two profiles run a DAST scan with [OWASP ZAP](https://www.zaproxy.org/) as a proxy, driven by real Playwright journeys rather than a crawler:

- `security` — passive scan across the e2e suite, cheap enough to run broadly
- `security:active` — passive plus a scoped active scan against the `@active` suite; docker-compose only, because that suite is destructive

See [`docs/security.md`](docs/security.md) for how to run it, what is scanned and why, and how the run is gated.

## Running Tests on GitHub

E2E tests run in GitHub Actions via the workspace's reusable workflow, which starts the workspace stack with `run-stack.sh --branch <branch>` and runs this repo's published test image against it, with reports published to GitHub Pages.

### GitHub Actions workflow

The `/.github/workflows/workspace-e2e-tests.yml` workflow triggers after `Publish Branch Image` completes and calls `DEFRA/trade-imports-workspace/.github/workflows/e2e-tests.yml@main` with the branch name, then reports the result back to the PR.

### Scheduled security scan

`.github/workflows/scheduled-security-scan.yml` calls the workspace's `security-active-scan.yml`. Manual dispatch only for now — see [`docs/security.md`](docs/security.md).

## Running Tests via CDP Portal

Test Suite URL: https://portal.cdp-int.defra.cloud/test-suites/trade-imports-ins-tests (requires CCoE AWS OpenVPN).

In the CDP Portal, provide a `PROFILE` value to choose which test suite the container runs via `entrypoint.sh`.
If `PROFILE` is not set, the `default` profile is used.

| PROFILE           | Test suite                                                                                     | NPM script              |
| ----------------- | ---------------------------------------------------------------------------------------------- | ----------------------- |
| `default`         | e2e test suite                                                                                 | `npm test`              |
| `a11y`            | accessibility test suite                                                                       | `npm run test:a11y`     |
| `security`        | security test suite (ZAP passive scan)                                                         | `npm run test:security` |
| `security:active` | **not supported on CDP** — refused by `entrypoint.sh`; run it against the docker-compose stack | —                       |

The profiles above run every domain. To run one domain's suite only, prefix the
suite with its project name as `<domain>:<suite>`:

| PROFILE                    | Test suite                                                 |
| -------------------------- | ---------------------------------------------------------- |
| `<domain>:e2e`             | that domain's e2e suite (`npm test -- --project=<domain>`) |
| `<domain>:a11y`            | that domain's accessibility suite                          |
| `<domain>:security`        | that domain's security suite (ZAP passive scan)            |
| `<domain>:security:active` | **not supported on CDP**, as `security:active`             |

`<domain>` is one of `animals`, `animals-admin`, `ins` or `plants`, e.g.
`animals:a11y` or `plants:e2e`. A domain with no specs for a suite (for example
`plants:a11y` today) fails with Playwright's "No tests found".

Tests are run from the CDP Portal under the Test Suites section. See the requirements below for how the portal run executes and publishes results.

### CDP Portal requirements

- The CDP Portal run depends on the image being built/published by `/.github/workflows/publish.yml` (from this repo's `Dockerfile`).
- The container entrypoint (`entrypoint.sh`) must exit `0` on success and a non-zero code on failure.
- Reports are published to S3 by `npm run report:publish` (which runs `./bin/publish-tests.sh` and uses `RESULTS_OUTPUT_S3_PATH`).

## Developer Workflow

### Linting

This project uses **ESLint** and **Prettier** for code quality and formatting.

| Action                   | Command                | Tool       |
| ------------------------ | ---------------------- | ---------- |
| Check for linting issues | `npm run lint`         | ESLint     |
| Auto-fix linting         | `npm run lint:fix`     | ESLint     |
| Format code              | `npm run format`       | Prettier   |
| Check code formatting    | `npm run format:check` | Prettier   |
| Type check TypeScript    | `npm run typecheck`    | TypeScript |

### Commit Checklist

Before committing changes:

- Run `npm run lint:fix` to auto-fix linting issues
- Run `npm run format` to format code
- Run `npm run typecheck` to check types (recommended)

### Pre-commit Hooks

This project uses **Husky** and **lint-staged** to automatically validate code quality before commits. The pre-commit hook checks linting (ESLint) and formatting (Prettier) on staged files only. If checks fail, the commit is blocked.

## Troubleshooting

### Tests fail with browser not found

Run `npx playwright install` to install required browsers.

### TypeScript errors

Ensure TypeScript is properly installed and `tsconfig.json` is configured correctly.

### Tests timeout

Increase timeout in `playwright.config.ts` or in individual tests using `test.setTimeout()`.

### Apple Silicon Docker build fails

Build with `--platform=linux/amd64` due to the AWS CLI v2 dependency:

```bash
docker build --platform=linux/amd64 .
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright TypeScript Guide](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government licence v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.

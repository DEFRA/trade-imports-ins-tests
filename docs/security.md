# Security testing

A DAST (Dynamic Application Security Testing) scan using [OWASP ZAP](https://www.zaproxy.org/) as a proxy. Playwright drives real authenticated journeys through it rather than letting ZAP crawl, so it observes what a real session touches and then attacks that.

Coverage is therefore **traffic-driven**: a route no spec drives is invisible to the scan. That is why the `@active` corpus is curated by hand rather than generated.

## Profiles

| Profile           | Suite                              | Attacks           | Use                             |
| ----------------- | ---------------------------------- | ----------------- | ------------------------------- |
| `security`        | The e2e suite, excluding `@active` | No — passive only | Cheap, run broadly              |
| `security:active` | The `@active` suite only           | Yes               | Deliberate; docker-compose only |

`@active` is excluded from the passive profile because it walks the same journeys a second time and includes destructive steps.

## How it runs

Three lanes, and they do not all use the same config or target:

| Lane              | Triggered by                                                                           | Playwright config                     | Target                    | Profiles          |
| ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------- | ----------------- |
| **Local**         | `npm run test:docker-compose:security[:active]`                                        | `playwright.docker-compose.config.ts` | localhost stack           | both              |
| **GitHub Action** | `.github/workflows/scheduled-security-scan.yml` → workspace `security-active-scan.yml` | `playwright.docker-compose.config.ts` | stack on the runner       | `security:active` |
| **CDP portal**    | `PROFILE` env var → `entrypoint.sh`                                                    | `playwright.config.ts`                | deployed `${ENVIRONMENT}` | `security` only   |

**`security:active` is refused on CDP.** The `@active` suite deletes notifications, documents and DLQ messages, and the active scan re-fires each with fuzzed payloads — fine against a disposable stack, destructive against a shared one. `entrypoint.sh` writes to `FAILED` rather than running it. The `throwIfProdEnvironment` guard is no help here: it stops `prod` alone, so `dev`, `test` and `perf-test` would all have run.

The GitHub Action is manual dispatch only; the nightly schedule stays disabled pending a verified end-to-end run. Its report publishes to GitHub Pages under `security-active/<date>/`, password-protected via the `ZAP_REPORT_PASSWORD` secret because that Pages site is otherwise public. Reports older than 7 days are pruned.

## Running locally

1. From the [workspace root](https://github.com/DEFRA/trade-imports-workspace), start the app stack: `tim docker up`
2. Bring up ZAP too — additive, and waits for healthchecks so it returns only once ZAP is accepting requests: `tim docker up --profile security`
3. Run a profile: `npm run test:docker-compose:security` or `npm run test:docker-compose:security:active`
4. Leave ZAP running between runs, or `docker stop trade-imports-zap-1`

To watch ZAP's own log live: `docker logs -f trade-imports-zap-1`.

Reports land in `zap-report/` (gitignored), created by ZAP on first `up`. `_zap_clean` clears its contents but never the directory — ZAP bind-mounts it at container start, so removing it mid-life breaks the mount.

> **Docker Desktop for Mac:** ZAP needs `network_mode: host` to resolve the stack's `localhost` OIDC redirects. OrbStack supports this out of the box; Docker Desktop needs 4.34+ with host networking enabled in Settings (off by default).

ZAP runs as part of the shared workspace stack (`docker/stack/security.compose.yml`). On CDP the same plan files and gate are reused, with ZAP as an in-process daemon rather than a container.

## What gets scanned

| Service                          | Local port | ZAP context    |
| -------------------------------- | ---------- | -------------- |
| `trade-imports-animals-frontend` | 3000       | `frontend`     |
| `trade-imports-animals-admin`    | 3001       | `admin`        |
| `trade-imports-ins-frontend`     | 3002       | `ins`          |
| `trade-imports-animals-backend`  | 8085       | `backend`      |
| `trade-imports-address-book`     | 8089       | `address-book` |

The `@active` corpus is written against the three frontends. The two APIs are scanned all the same: every API client here is built from Playwright's own `request` fixture, which inherits the project's proxy, so the specs' seeding and assertion calls reach ZAP as real traffic.

Ports are the compose stack's; on CDP each service is a per-service subdomain. Diagnostics are excluded rather than scanned: `/health` and static assets on the Node contexts, and the full actuator set (`/health`, `/info`, `/metrics`, `/cache`, `/env`) on the two Java services.

### What is not, and why

| Service                              | Why                                                                                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trade-imports-defra-id-stub` (3007) | A temporary sign-in stub we do not own. Observed passively, never attacked. Our own `/auth/sign-in` and `/auth/sign-in-oidc` handlers **are** in scope — the OIDC callback and its `redirect` parameter outlive the stub. |
| `cdp-uploader` (7337)                | A platform component. The browser posts uploads to the frontend, which forwards them server-side, so the uploader never enters the site tree.                                                                             |
| `trade-imports-ins-backend` (8090)   | An SQS consumer with no HTTP controllers. Its risk boundary is the queue, which DAST cannot reach; the API that produces those events is scanned.                                                                         |

## Gating

`utils/zap/run-and-gate.ts` fails a run on any of three conditions:

- **A FAIL-rated alert.** `zap/rules.tsv` maps ZAP plugin ids to `IGNORE`/`WARN`/`FAIL`; anything unlisted defaults to FAIL if High risk and WARN otherwise.
- **A truncated scan.** Each context is capped at 60 minutes (`maxScanDurationInMins`), and `ACTIVE_SCAN_CAP_MINS` must match that number exactly. A scan that finishes at the ceiling was cut short, and an incomplete scan reporting no findings is a false clean.
- **A context with no traffic.** Declared but undriven means its activeScan job scanned nothing and reported clean. Active profile only.

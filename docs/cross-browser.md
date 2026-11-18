# Cross-browser testing

Tests tagged `@cross-browser` also run outside Chromium, to find browser-specific problems before users do. They run in Playwright's own browsers and on BrowserStack. Commands live beside each domain's tests, in `tests/<domain>/cross-browser/README.md`.

## Strategy

Tag existing e2e tests so that, together, they render as many pages as possible in each engine.

- Choose tests that also run on CDP.
- Leave out validation and backend checks, which do not vary by browser.
- Leave out `@visual`, `@a11y` and security specs: snapshots are per engine, and axe and ZAP results barely change by browser.
- Prefer a journey walk, then one test for each page the walks do not reach.

## Adding a test

Tag it:

```ts
test('renders the page', { tag: '@cross-browser' }, async ({ insPages }) => {});
```

It still runs in the Chromium e2e run. Tag it only if it runs on CDP and renders a page the set does not already cover.

## Playwright browsers

Playwright runs Firefox, WebKit, an emulated iPhone 17 and an emulated Pixel 10 itself, on your machine or on CDP.

### How it works

- The `firefox`, `webkit`, `mobile-webkit` and `mobile-chromium` projects in `utils/playwright/shared-config.ts` have `default: false`, so they run only when `--project` names them. Every other script stays on Chromium.
- The commands add `--grep '@cross-browser'`. Without it a named engine runs every test.
- Write `--project=firefox`, not `--project firefox`: `--project` takes several values, so a trailing path would be read as a project name.
- Do not run these engines with `PLAYWRIGHT_IN_CONTAINER=1`. Its host-resolver rule is Chromium-only.
- `npm run test:docker-compose:cross-browser` runs every domain. The CDP `cross-browser` and `<domain>:cross-browser` profiles do the same on CDP, excluding `@compose` tests.

### iPhone emulation

The `mobile-webkit` project emulates an iPhone 17 on WebKit, to catch layout problems at phone size. It is emulation, not a real device.

- On an iPhone user agent, `accessible-autocomplete` adds a hidden "1 of 7" to each suggestion, so `TypeAhead.option()` accepts an optional position suffix.
- Specs must not assume a fixed viewport.

## BrowserStack

> [!WARNING]
> TODO: finish this section. Only Windows 11 Firefox is configured; CDP and GitHub runs are not wired up.

BrowserStack runs the `@cross-browser` tests on its own browsers, one run per `platforms` entry in `browserstack.yml`. Playwright can drive only its own builds, Chrome, Edge and iOS Safari, so real desktop Safari is not available.

- Put `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` in `.env`.
- Start the docker-compose stack, then run `npm run test:docker-compose:browserstack` (or `test:docker-compose:<domain>:browserstack`).
- BrowserStack Local carries the stack's `localhost` URLs to the remote browser. Safari, WebKit and Android browsers cannot open `localhost` through it.
- Builds are named `local`, `github` or `cdp-<ENVIRONMENT>`, with a UTC time or the run id as the identifier, under the project `trade-imports-ins-tests`.

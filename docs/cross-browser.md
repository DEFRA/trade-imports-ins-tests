# Cross-browser testing

Tests tagged `@cross-browser` also run in Playwright's Firefox, WebKit and an emulated iPhone 17, to find browser-specific problems before users do. Commands live beside each domain's tests, in `tests/<domain>/cross-browser/README.md`.

## Strategy

Tag existing e2e tests so that, together, they render as many pages as possible in each engine.

- Choose tests that also run on CDP.
- Leave out validation and backend checks, which do not vary by browser.
- Leave out `@visual`, `@a11y` and security specs: snapshots are per engine, and axe and ZAP results barely change by browser.
- Prefer a journey walk, then one test for each page the walks do not reach.

## How it works

- The `firefox`, `webkit` and `mobile-webkit` projects in `utils/playwright/shared-config.ts` have `default: false`, so they run only when `--project` names them. Every other script stays on Chromium.
- The commands add `--grep '@cross-browser'`. Without it a named engine runs every test.
- Write `--project=firefox`, not `--project firefox`: `--project` takes several values, so a trailing path would be read as a project name.
- Do not run these engines with `PLAYWRIGHT_IN_CONTAINER=1`. Its host-resolver rule is Chromium-only.
- `npm run test:docker-compose:cross-browser` runs every domain. The CDP `cross-browser` and `<domain>:cross-browser` profiles do the same on CDP, excluding `@compose` tests.

## Adding a test

Tag it:

```ts
test('renders the page', { tag: '@cross-browser' }, async ({ insPages }) => {});
```

It still runs in the Chromium e2e run. Tag it only if it runs on CDP and renders a page the set does not already cover.

## iPhone emulation

The `mobile-webkit` project emulates an iPhone 17 on WebKit, to catch layout problems at phone size. It is emulation, not a real device.

- On an iPhone user agent, `accessible-autocomplete` adds a hidden "1 of 7" to each suggestion, so `TypeAhead.option()` accepts an optional position suffix.
- Specs must not assume a fixed viewport.

## Later

BrowserStack (real Safari and devices) can reuse the same `@cross-browser` tag with a different runner.

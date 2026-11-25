# Cross-browser testing

Tests tagged `@cross-browser` also run outside the default Chromium run, to find browser-specific problems before users do. They run in two ways:

- **Playwright run** (`cross-browser` profile): Playwright launches its own browser builds, plus branded Chrome, in our test image on CDP or on your machine.
- **BrowserStack run** (`browserstack` profile): real browsers and devices on BrowserStack, reached through its tunnel, from CDP or from your machine.

Each domain's commands are in `tests/<domain>/cross-browser/README.md`.

## Where each browser runs

**Playwright run** (`cross-browser` profile): Playwright launches these projects, from `utils/playwright/shared-config.ts`, on Linux in our test image on CDP, or on your own machine.

| Project           | Device              | Browser               | Tests                              |
| ----------------- | ------------------- | --------------------- | ---------------------------------- |
| `chromium`        | Desktop             | Playwright's Chromium | Every test, in the default e2e run |
| `chrome`          | Desktop             | Real Chrome           | `@cross-browser`                   |
| `firefox`         | Desktop             | Playwright's Firefox  | `@cross-browser`                   |
| `webkit`          | Desktop             | Playwright's WebKit   | `@cross-browser`                   |
| `mobile-webkit`   | iPhone 17, emulated | Playwright's WebKit   | `@cross-browser`                   |
| `mobile-chromium` | Pixel 10, emulated  | Playwright's Chromium | `@cross-browser`                   |

**BrowserStack run** (`browserstack` profile): BrowserStack runs these platforms, from `browserstack.yml`, each on the newest browser it offers for that platform.

| OS                   | Device        | Browser                        | Tests            |
| -------------------- | ------------- | ------------------------------ | ---------------- |
| Windows 11           | Desktop       | Real Edge                      | `@cross-browser` |
| macOS 27 Golden Gate | Desktop       | Playwright's WebKit (Mac port) | `@cross-browser` |
| iOS 27               | iPhone 18 Pro | Real Safari                    | `@ios`           |
| iOS 26               | iPhone 17     | Real Safari                    | `@ios`           |

## Why these browsers

Last reviewed: November 2026. The list comes from the [GDS browser guidance](https://www.gov.uk/service-manual/technology/designing-for-different-browsers-and-devices).

**Playwright** covers every engine GDS lists, cheaply and reliably, on every run.

- **Chromium** runs every test. It's usually ahead of stable Chrome, so it catches breakage early.
- **Chrome** is the released branded build. It's close enough to trust for desktop Chrome, and it covers Edge's engine. What differs on Windows and macOS is mostly font rendering.
- **Firefox** is Playwright's build, close to real Firefox, and the only Firefox Playwright drives reliably.
- **WebKit** is Safari's engine, not Safari: the Linux port, without Safari's platform layer or cookie rules.
- **The emulated iPhone 17 and Pixel 10** catch layout problems at phone size, but not touch, the on-screen keyboard or a real mobile viewport.

**BrowserStack** fills the gaps Playwright's builds leave, rather than repeating them.

- **Edge on Windows 11.** Windows is on the GDS list, and Edge ships with it. Managed Windows machines often come with Edge alone, and traders may use them. The `chrome` project covers Edge's engine but not Edge itself: its enterprise policies, tracking prevention, and Windows form controls, fonts and high contrast mode. It runs on BrowserStack, so the test image doesn't have to download Edge. Windows 10 is out of [support](https://endoflife.date/windows).
- **Safari on real iPhones.** The biggest gap: WebKit and the emulated iPhone miss Safari's platform layer, cookie rules, touch, the on-screen keyboard and the real viewport. Every iPhone browser in the UK uses Safari's engine, so this covers Chrome and Edge on iOS too.
- **iOS 27 and 26.** Each iOS version ships its own Safari. iOS 27 is current and iOS 26 still gets security updates. Older versions mainly serve iPhones that can't run iOS 26, which we don't support. See [endoflife.date](https://endoflife.date/ios).
- **WebKit on macOS.** BrowserStack offers no real macOS Safari for Playwright. Playwright's Mac port of WebKit is closer to Safari than the Linux build.
- **One macOS version.** Playwright's WebKit comes with our Playwright release, not with macOS, so older macOS versions run the same browser. Only the system underneath differs, which is unlikely to change a result. See [endoflife.date](https://endoflife.date/macos).

### Not covered

- **Real Android** (Chrome, Samsung Internet, Firefox). BrowserStack supports it only up to Playwright 1.62. The emulated Pixel 10 covers Chrome's and Samsung Internet's engine at phone size, and `firefox` covers Android Firefox's. Before a release, you can check them by hand on BrowserStack Live.
- **Real Firefox.** Playwright reliably drives only its own build. Its `moz-firefox` channels are experimental and undocumented.
- **Real macOS Safari.** Not available through Playwright.
- **Chrome on Windows and macOS.** `chrome` runs on Linux; the operating system mostly changes font rendering.

## Tagging a test

Tag existing e2e tests so that, together, they render as many pages as possible in each engine:

- Choose tests that run on CDP.
- Prefer a journey walk, then one test for each page the walks don't reach.
- Leave out validation and backend checks, which don't vary by browser.
- Leave out `@visual`, `@a11y` and security specs: snapshots are per engine, and axe and ZAP results barely change by browser.

```ts
test('renders the page', { tag: '@cross-browser' }, async ({ insPages }) => {});
```

A tagged test still runs in the Chromium e2e run. The iPhones run only tests tagged `@ios`: see [Real iPhones](#real-iphones).

## Running the Playwright projects

- Every project except `chromium` has `default: false`, so it runs only when `--project` names it.
- The commands add `--grep '@cross-browser'`. Without it, a named project runs every test.
- Write `--project=firefox`, not `--project firefox`. `--project` takes several values, so a trailing path would be read as a project name.
- `chrome` launches the installed Google Chrome. The amd64 test image installs it (Google publishes no Linux Arm64 build). Locally, install it from Google: `npx playwright install chrome` would replace the browser you already have.
- `npm run test:docker-compose:cross-browser` runs every domain. On CDP, the `cross-browser` and `<domain>:cross-browser` profiles do the same, leaving out `@compose` tests.

The emulated iPhone 17 is emulation, not a real device:

- On an iPhone user agent, `accessible-autocomplete` adds a hidden "1 of 7" to each suggestion, so `TypeAhead.option()` accepts an optional position suffix.
- Specs must not assume a fixed viewport.

## Running on BrowserStack

Put `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` in `.env`, from the team's BrowserStack service account, not a personal login. GitHub Actions doesn't run BrowserStack.

| Against                  | From         | How                                                                                                                                                      | Platforms                |
| ------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| A CDP environment        | CDP          | The `browserstack` or `<domain>:browserstack` profile                                                                                                    | All                      |
| A CDP environment        | Your machine | `RUN_ID=local-<time> npm run test:browserstack`, with the `.env` from [Target CDP environments](../README.md#target-cdp-environments-from-local-machine) | All                      |
| The docker-compose stack | Your machine | `npm run test:docker-compose:browserstack` (or `test:docker-compose:<domain>:browserstack`)                                                              | All; only Windows passes |

- **The tunnel.** BrowserStack Local is always on. It carries the docker-compose stack's `localhost` URLs, and CDP's hostnames, to the remote browser. Safari and WebKit can't open `localhost` through it, so against the docker-compose stack the macOS and iPhone platforms fail. Use a CDP environment for them.
- **Sessions.** A run uses one session per CPU, shared across the platforms, up to the team-wide limit of 13 in all, and at least 1 per platform. With four platforms, 4 CPUs run 4 sessions and 8 CPUs run 8. Set `BROWSERSTACK_PARALLELS_PER_PLATFORM` to choose the sessions per platform yourself; the limit of 13 then doesn't apply.
- **Signing in.** Session reuse is off (`E2E_SESSION_REUSE=off`), so every test signs in for itself. See [Real iPhones](#real-iphones).
- **Results.** Each run prints its link, under https://automate.browserstack.com/projects/trade-imports-ins-tests. Builds are named `local`, `github` or `cdp-<ENVIRONMENT>`, with a UTC time or the run id as the identifier. A run from your machine against CDP is named `cdp-<ENVIRONMENT>`, with your `RUN_ID` as the identifier.
- **The proxy.** On CDP, `HTTP_PROXY` makes the SDK write `require("global-agent")` into its generated config, which fails in an ES module project. `bin/browserstack-global-require.mjs` defines a global `require`, and `bin/run-browserstack.ts` preloads it.

### Real iPhones

Don't change idiomatic Playwright code to work around BrowserStack.

The iPhones run short flows only, because BrowserStack's iOS support isn't reliable over long journeys. Playwright's WebKit, the emulated iPhone 17 and macOS run the journeys instead.

On a real iPhone, BrowserStack translates Playwright commands to Safari rather than running Playwright, and supports only the commands on its [supported iOS commands](https://www.browserstack.com/docs/automate/playwright/references/supported-ios-commands) list. The `skipTestsWithoutPlatformTag` fixture in `fixtures/browserstack.ts` skips every test without the platform's tag, so the iPhones run only `@ios` tests and the desktop platforms only `@cross-browser` ones. The rest show as skipped.

```ts
test('renders the address book after signing in', { tag: ['@cross-browser', '@ios'] }, async ({ insPages }) => {});
```

A test can take `@ios` only if it uses one browser context and one page. So it can't sign in a second user, open a second tab, turn JavaScript off, or seed through `frontendForms` or `animalsSeededJourney`, whose seed session opens a second context. This is why session reuse is off: BrowserStack allows one context per session, and doesn't restore cookies from `storageState` on iOS.

To try a test on the iPhones, tag it `@ios` on a branch and run the CDP `browserstack` profile. Keep the tag only if the test passes on both iPhones; otherwise remove it.

`consoleLogs` and Playwright logs aren't available on iOS. Both still apply to the desktop platforms.

## Reviewing the browsers

| When                                 | Check                                                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| GDS updates its list (February)      | Compare it with [Where each browser runs](#where-each-browser-runs)                                                               |
| Apple releases a new iOS (September) | Move the iPhones to the newest two iOS versions                                                                                   |
| Apple releases a new macOS (autumn)  | Move the macOS platform to the newest version                                                                                     |
| Windows 11 reaches end of support    | Move the Windows platform to the newest version                                                                                   |
| `@playwright/test` is upgraded       | Check BrowserStack still offers Edge on Windows 11 and `playwright-webkit` on our macOS, and whether it supports real Android yet |
| BrowserStack adds iOS commands       | Try more `@cross-browser` tests on the iPhones                                                                                    |
| Playwright documents `moz-firefox`   | Add a real Firefox project                                                                                                        |

A change of browser updates `browserstack.yml` or `utils/playwright/shared-config.ts`, the [Where each browser runs](#where-each-browser-runs) table and [Why these browsers](#why-these-browsers).

## Reference

- [GOV.UK Service Manual: designing for different browsers and devices](https://www.gov.uk/service-manual/technology/designing-for-different-browsers-and-devices), the GDS browser list we test against.
- [BrowserStack: Playwright browsers and operating systems](https://www.browserstack.com/docs/automate/playwright/browsers-and-os), by Playwright version.
- [BrowserStack: browsers and platforms for Automate](https://www.browserstack.com/list-of-browsers-and-platforms/automate), including real devices.
- [BrowserStack: capabilities](https://www.browserstack.com/docs/automate/capabilities), the values `browserstack.yml` platforms take.
- [BrowserStack: supported Playwright commands for iOS](https://www.browserstack.com/docs/automate/playwright/references/supported-ios-commands), what a real iPhone can run.
- [BrowserStack: Playwright on real iOS devices](https://www.browserstack.com/docs/automate/playwright/playwright-ios/nodejs), including the capabilities iOS doesn't support.
- Devices Playwright can emulate, from our installed version:

  ```bash
  node -e "console.log(Object.keys(require('@playwright/test').devices).join('\n'))"
  ```

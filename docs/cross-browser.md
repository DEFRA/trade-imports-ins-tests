# Cross-browser testing

Tests tagged `@cross-browser` also run outside the default Chromium run, to find browser-specific problems before users do. They run in two ways:

- **Playwright run** (`cross-browser` profile): Playwright launches the browsers itself, inside our test image on CDP, or natively on your machine. These are Playwright's own builds plus branded Chrome.
- **BrowserStack run** (`browserstack` profile): BrowserStack's remote browsers and real devices, reached through its tunnel, on CDP or from your machine.

Commands live beside each domain's tests, in `tests/<domain>/cross-browser/README.md`.

## Tagging strategy

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

## Browsers

**Playwright run** (`cross-browser` profile): Playwright launches these projects, from `utils/playwright/shared-config.ts`, in our test image on CDP, or natively on your machine.

| Project           | Browser                                        | Runs                               |
| ----------------- | ---------------------------------------------- | ---------------------------------- |
| `chromium`        | Playwright's Chromium build                    | Every test, in the default e2e run |
| `chrome`          | Branded Google Chrome, installed               | `@cross-browser` tests             |
| `firefox`         | Playwright's Firefox build                     | `@cross-browser` tests             |
| `webkit`          | Playwright's WebKit build                      | `@cross-browser` tests             |
| `mobile-webkit`   | Playwright's WebKit build, emulated iPhone 17  | `@cross-browser` tests             |
| `mobile-chromium` | Playwright's Chromium build, emulated Pixel 10 | `@cross-browser` tests             |

**BrowserStack run** (`browserstack` profile): BrowserStack runs the `@cross-browser` tests on its remote browsers and real devices, one run per platform in `browserstack.yml`.

| Operating system     | Device        | Browser                   |
| -------------------- | ------------- | ------------------------- |
| macOS 27 Golden Gate | Desktop       | Playwright's WebKit build |
| iOS 27               | iPhone 18 Pro | Safari                    |
| iOS 26               | iPhone 17     | Safari                    |

Each platform runs the latest stable browser BrowserStack offers for it: Safari from the newest release of each iOS version, and the `playwright-webkit` build that matches our Playwright version.

### Why these browsers

Last reviewed: November 2026. Revisit them when GDS updates its list (yearly, around February) or Apple releases a new iOS or macOS.

**Playwright** runs every engine GDS lists, cheaply and reliably, on every Playwright run.

- **Chromium.** `chromium` (Chrome for Testing) runs every test. It's usually ahead of stable, so it catches breakage early.
- **Chrome.** `chrome` runs the released branded Chrome. Close enough to trust for desktop Chrome and Edge: what differs on Windows and macOS is font rendering and branded features. Edge has no project of its own: it shares Chrome's engine and differs only in a thin branded layer, so `chromium` and `chrome` cover it.
- **Firefox.** Playwright's Firefox build is close to real Firefox, and the only Firefox Playwright drives reliably.
- **WebKit.** Safari's engine, not Safari. Our image runs the Linux port, without Safari's platform layer or cookie rules, which BrowserStack covers.
- **Emulated iPhone 17 and Pixel 10.** Catch layout problems at phone size, but not touch, the on-screen keyboard or a real mobile viewport.

**BrowserStack** complements the Playwright projects rather than repeating them. It runs only where a real browser or device differs from Playwright's builds in ways that can break the service.

- **iOS Safari on a real iPhone.** The biggest gap: Playwright's WebKit and emulated iPhone miss Safari's platform layer, cookie rules, touch, the on-screen keyboard and the real viewport. In the UK every iPhone browser uses Safari's engine, so this covers Chrome and Edge on iOS too.
- **iOS 27 and 26 only.** Each iOS version ships its own Safari. iOS 27 is the current release and iOS 26 still gets security updates. Older versions (iOS 18 and earlier) get updates mainly for older iPhones that can't run iOS 26, and we don't support those devices. See [endoflife.date](https://endoflife.date/ios).
- **Playwright's WebKit on macOS.** BrowserStack's Playwright support has no real macOS Safari. Playwright's WebKit on macOS is the Mac port, closer to Safari than the Linux build in our image.
- **One macOS version.** Apple usually gives security updates to the current macOS and the two before it: 27 Golden Gate, 26 Tahoe and 15 Sequoia. We test only the newest. Playwright's WebKit comes with our Playwright release, not with macOS, so older versions run the same browser; only the system underneath (networking, cookie storage, fonts) differs, which is unlikely to change a result. See [endoflife.date](https://endoflife.date/macos).

Not covered:

- **Real Android** (Chrome, Samsung Internet, Firefox). BrowserStack supports it only up to Playwright 1.62. `mobile-chromium` covers Chrome and Samsung Internet's engine at phone size; `firefox` covers Android Firefox's engine. Add real Android Chrome once BrowserStack supports our Playwright version.
- **Real Firefox.** Playwright reliably drives only its own build. Its `moz-firefox` channels, which drive stock Firefox over WebDriver BiDi, are experimental and undocumented. Optional: once documented, add a real Firefox project, as `chrome` is for Chrome.
- **Real macOS Safari.** Not available through Playwright.
- **Chrome and Edge on Windows, Chrome on macOS.** `chrome` runs branded Chrome on Linux; the operating system mostly changes font rendering. Real Edge isn't tested.

Optional: before a release, check Samsung Internet, Android Chrome and Android Firefox by hand on BrowserStack Live. Real Android is the only GDS platform no automated run covers.

### Reviewing the browsers

| When                                 | Check                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Apple releases a new iOS (September) | Move the iOS platforms to the newest two versions                                                                  |
| Apple releases a new macOS (autumn)  | Move the macOS platform to the newest version                                                                      |
| GDS updates its list (February)      | Compare it with the tables above                                                                                   |
| `@playwright/test` is upgraded       | Check BrowserStack still offers `playwright-webkit` on our macOS version, and whether it now supports real Android |
| Playwright documents `moz-firefox`   | Add a real Firefox project                                                                                         |

A change updates `browserstack.yml` or `utils/playwright/shared-config.ts`, the tables and "Why these browsers" above, and each domain's `cross-browser/README.md`.

## Running the Playwright projects

### How it works

- Every Playwright project except `chromium` has `default: false`, so it runs only when `--project` names it. Every other script stays on Chromium.
- The commands add `--grep '@cross-browser'`. Without it a named engine runs every test.
- `chrome` launches the installed Google Chrome. The amd64 test image installs it (Google publishes no Linux Arm64 build); locally, install it from Google. Do not run `npx playwright install chrome` on your own machine: it replaces the browser you already have.
- Write `--project=firefox`, not `--project firefox`: `--project` takes several values, so a trailing path would be read as a project name.
- `npm run test:docker-compose:cross-browser` runs every domain. The CDP `cross-browser` and `<domain>:cross-browser` profiles do the same on CDP, excluding `@compose` tests.

### iPhone emulation

The `mobile-webkit` project emulates an iPhone 17 on WebKit, to catch layout problems at phone size. It is emulation, not a real device.

- On an iPhone user agent, `accessible-autocomplete` adds a hidden "1 of 7" to each suggestion, so `TypeAhead.option()` accepts an optional position suffix.
- Specs must not assume a fixed viewport.

## Running on BrowserStack

The BrowserStack run uses the platforms in [Browsers](#browsers). It runs on CDP, against a CDP environment, and from your machine against the docker-compose stack. GitHub Actions doesn't run it.

- Put `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` in `.env`. Use the team's BrowserStack service account, not a personal login.
- Start the docker-compose stack, then run `npm run test:docker-compose:browserstack` (or `test:docker-compose:<domain>:browserstack`).
- On CDP, run the `browserstack` or `<domain>:browserstack` profile.
- BrowserStack Local is always on. It carries the docker-compose stack's `localhost` URLs, and CDP's hostnames, which resolve only inside the platform, to the remote browser.
- Safari, WebKit and Android browsers cannot open `localhost` through BrowserStack Local, so the iOS and macOS platforms run only on CDP.
- When a proxy is set (`HTTP_PROXY`, as on CDP), the SDK writes `require("global-agent")` into its generated Playwright config, which fails in an ES module project. `bin/browserstack-global-require.mjs` defines a global `require` for it, and `bin/run-browserstack.ts` preloads that file into the SDK and its workers.
- Each run prints its results link, under https://automate.browserstack.com/projects/trade-imports-ins-tests.
- Each platform runs half your CPUs in parallel, up to the team-wide limit of 13 sessions. Set `BROWSERSTACK_PARALLELS_PER_PLATFORM` to change it.
- Builds are named `local`, `github` or `cdp-<ENVIRONMENT>`, with a UTC time or the run id as the identifier, under the project `trade-imports-ins-tests`.

## Reference

- [GOV.UK Service Manual: designing for different browsers and devices](https://www.gov.uk/service-manual/technology/designing-for-different-browsers-and-devices), the GDS browser list we test against.
- [BrowserStack: Playwright browsers and operating systems](https://www.browserstack.com/docs/automate/playwright/browsers-and-os), by Playwright version.
- [BrowserStack: browsers and platforms for Automate](https://www.browserstack.com/list-of-browsers-and-platforms/automate), including real devices.
- [BrowserStack: capabilities](https://www.browserstack.com/docs/automate/capabilities), the values `browserstack.yml` platforms take.
- Devices Playwright can emulate (names for `devices['…']` in `shared-config.ts`), from our installed version:

  ```bash
  node -e "console.log(Object.keys(require('@playwright/test').devices).join('\n'))"
  ```

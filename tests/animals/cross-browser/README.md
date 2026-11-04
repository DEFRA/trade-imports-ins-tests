# cross-browser

This folder holds no specs. The animals cross-browser tests are existing e2e specs, selected by the
`@cross-browser` tag and run in Playwright's Firefox and WebKit.

## Strategy

Tag existing e2e tests so that, together, they render as many animals pages as possible in each engine.

- Walk the journey, then add one test for each page the walks do not reach.
- Choose tests that also run on CDP.
- Leave out validation and backend checks, which do not vary by browser.

## Run on the local stack

Run against the docker-compose stack, from the repo root.

| Command                                                                                                    | Runs                                    |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `npm run test:docker-compose:animals:cross-browser`                                                        | Firefox and WebKit, in one run          |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=firefox tests/animals/`       | Firefox only                            |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=webkit tests/animals/`        | WebKit only                             |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=mobile-webkit tests/animals/` | iPhone 17 on WebKit (paused, see below) |

## Run on CDP

Run the `animals:cross-browser` profile.

## Mobile (paused)

The `mobile-webkit` project (iPhone 17 on WebKit) stays in `utils/playwright/shared-config.ts`, but is paused.

- On an iPhone user agent, `accessible-autocomplete` adds a hidden "1 of 7" to each suggestion, so `TypeAhead.option()` no longer matches "France" exactly. The 10 tests that choose a country time out.
- Fix that helper first. iOS also turns autoselect off, so expect more differences.

# cross-browser

This folder holds no specs. The animals cross-browser tests are existing e2e specs, selected by the
`@cross-browser` tag and run in Playwright's Firefox and WebKit.

## Commands

Run against the docker-compose stack, from the repo root. Install the browsers once with
`npx playwright install firefox webkit`.

| Command                                                                                     | Runs                                    |
| ------------------------------------------------------------------------------------------- | --------------------------------------- |
| `npm run test:docker-compose:cross-browser`                                                 | Firefox and WebKit, in one run          |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=firefox`       | Firefox only                            |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=webkit`        | WebKit only                             |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=mobile-webkit` | iPhone 17 on WebKit (paused, see below) |

## Notes

- The set is the journey walks, sign-in and one test for each page the walks do not reach, so every page is rendered in each engine. It leaves out validation and backend checks, which do not vary by browser.
- To add a test, tag it `{ tag: '@cross-browser' }`. It still runs in the Chromium e2e run.
- Visual, a11y and security specs stay out: snapshots are per engine, and axe and ZAP results barely change by browser.
- Only tests under `tests/animals/` carry the tag so far. The same commands pick up `tests/ins/` once it is tagged.
- Write `--project=firefox`, not `--project firefox`: `--project` takes several values, so a trailing path would be read as a project name.

## Mobile (paused)

The `mobile-webkit` project (iPhone 17 on WebKit) stays in `utils/playwright/shared-config.ts`, but is paused.

- On an iPhone user agent, `accessible-autocomplete` adds a hidden "1 of 7" to each suggestion, so `TypeAhead.option()` no longer matches "France" exactly. The 10 tests that choose a country time out.
- Fix that helper first. iOS also turns autoselect off, so expect more differences.

# cross-browser

This folder holds no specs. The animals cross-browser tests are existing e2e specs, selected by the
`@cross-browser` tag and run in Playwright's browsers, real Chrome, and on BrowserStack.

Strategy: see [`docs/cross-browser.md`](../../../docs/cross-browser.md).

## Playwright browsers

### Run on the local stack

Run against the docker-compose stack, from the repo root.

| Command                                                                                                      | Runs                                                        |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `npm run test:docker-compose:animals:cross-browser`                                                          | Chrome, Firefox, WebKit, iPhone 17 and Pixel 10, in one run |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=chrome tests/animals/`          | Chrome only                                                 |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=firefox tests/animals/`         | Firefox only                                                |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=webkit tests/animals/`          | WebKit only                                                 |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=mobile-webkit tests/animals/`   | iPhone 17 only                                              |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=mobile-chromium tests/animals/` | Pixel 10 only                                               |

### Run on CDP

Run the `animals:cross-browser` profile.

## BrowserStack

### Run on the local stack

Run against the docker-compose stack, from the repo root. Every platform runs, but only Windows Edge can open the stack's `localhost`. Run the others against CDP.

`npm run test:docker-compose:animals:browserstack`

### Run on CDP from your machine

Set the `.env` from [Target CDP environments](../../../README.md#target-cdp-environments-from-local-machine), then run from the repo root:

`RUN_ID=local-$(date -u +%Y%m%dT%H%M%SZ) npm run test:browserstack -- tests/animals/`

### Run on CDP

Run the `animals:browserstack` profile.

# cross-browser

This folder holds no specs. The animals-admin cross-browser tests are existing e2e specs, selected by the
`@cross-browser` tag and run in Playwright's browsers, branded Chrome and Edge, and on BrowserStack.

Strategy: see [`docs/cross-browser.md`](../../../docs/cross-browser.md).

## Playwright browsers

### Run on the local stack

Run against the docker-compose stack, from the repo root.

| Command                                                                                                            | Runs                                                              |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `npm run test:docker-compose:animals-admin:cross-browser`                                                          | Chrome, Edge, Firefox, WebKit, iPhone 17 and Pixel 10, in one run |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=chrome tests/animals-admin/`          | Chrome only                                                       |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=msedge tests/animals-admin/`          | Edge only                                                         |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=firefox tests/animals-admin/`         | Firefox only                                                      |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=webkit tests/animals-admin/`          | WebKit only                                                       |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=mobile-webkit tests/animals-admin/`   | iPhone 17 only                                                    |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=mobile-chromium tests/animals-admin/` | Pixel 10 only                                                     |

### Run on CDP

Run the `animals-admin:cross-browser` profile.

## BrowserStack

### Run on the local stack

Run against the docker-compose stack, from the repo root.

`npm run test:docker-compose:animals-admin:browserstack`

### Run on CDP

Run the `animals-admin:browserstack` profile.

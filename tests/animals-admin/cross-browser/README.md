# cross-browser

This folder holds no specs. The animals-admin cross-browser tests are existing e2e specs, selected by the
`@cross-browser` tag and run in Playwright's Firefox, WebKit, an emulated iPhone 17 and an emulated Pixel 10.

Strategy: see [`docs/cross-browser.md`](../../../docs/cross-browser.md).

## Run on the local stack

Run against the docker-compose stack, from the repo root.

| Command                                                                                                          | Runs                                                |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `npm run test:docker-compose:animals-admin:cross-browser`                                                        | Firefox, WebKit, iPhone 17 and Pixel 10, in one run |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=firefox tests/animals-admin/`       | Firefox only                                        |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=webkit tests/animals-admin/`        | WebKit only                                         |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=mobile-webkit tests/animals-admin/` | iPhone 17 only                                      |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=mobile-chrome tests/animals-admin/` | Pixel 10 only                                       |

## Run on CDP

Run the `animals-admin:cross-browser` profile.

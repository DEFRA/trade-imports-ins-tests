# cross-browser

This folder holds no specs. The INS cross-browser tests are existing e2e specs, selected by the
`@cross-browser` tag and run in Playwright's Firefox and WebKit.

Strategy: see [`docs/cross-browser.md`](../../../docs/cross-browser.md).

## Run on the local stack

Run against the docker-compose stack, from the repo root.

| Command                                                                                                | Runs                           |
| ------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `npm run test:docker-compose:ins:cross-browser`                                                        | Firefox and WebKit, in one run |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=firefox tests/ins/`       | Firefox only                   |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=webkit tests/ins/`        | WebKit only                    |
| `npm run _clean_and_test_docker_compose -- --grep '@cross-browser' --project=mobile-webkit tests/ins/` | iPhone 17 on WebKit (paused)   |

## Run on CDP

Run the `ins:cross-browser` profile.

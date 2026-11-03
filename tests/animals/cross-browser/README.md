# cross-browser

This folder holds no specs. The animals cross-browser tests are existing e2e specs, selected by the
`@cross-browser` tag and run in Playwright's Firefox and WebKit.

## Commands

Run against the docker-compose stack, from the repo root. Install the browsers once with
`npx playwright install firefox webkit`.

| Command                                             | Runs                           |
| --------------------------------------------------- | ------------------------------ |
| `npm run test:docker-compose:cross-browser`         | Firefox and WebKit, in one run |
| `npm run test:docker-compose:cross-browser:firefox` | Firefox only                   |
| `npm run test:docker-compose:cross-browser:webkit`  | WebKit only                    |

## Notes

- The set is the journey walks, sign-in and one test for each page the walks do not reach, so every page is rendered in each engine. It leaves out validation and backend checks, which do not vary by browser.
- To add a test, tag it `{ tag: '@cross-browser' }`. It still runs in the Chromium e2e run.
- Visual, a11y and security specs stay out: snapshots are per engine, and axe and ZAP results barely change by browser.
- Only tests under `tests/animals/` carry the tag so far. The same commands pick up `tests/ins/` once it is tagged.
- Write `--project=firefox`, not `--project firefox`: `--project` takes several values, so a trailing path would be read as a project name.

# trade-imports-ins-tests: agent notes

Playwright end-to-end, accessibility and security suite for the trade imports services, with one directory per domain: `animals`, `animals-admin`, `ins` and `plants`. See [README.md](README.md) for set-up and every run command.

## Layout

| Folder           | Holds                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `tests/<domain>` | The specs                                                                                   |
| `flows/<domain>` | Multi-page sequences: `journey.ts` `to*` methods and the actions built on them              |
| `page-objects`   | One class per page: locators and single-page actions                                        |
| `domain`         | Constants, models and types shared by specs; `domain/shared` for values used across domains |
| `fixtures`       | Playwright fixtures that hand specs their pages, flows and API clients                      |
| `adapters`       | Clients for the services' HTTP APIs, MongoDB and SQS                                        |
| `resources`      | Canned data: reference data, upload files and outbox events                                 |
| `utils`          | Helpers for dates, accessibility, ZAP and Playwright config                                 |

## Writing specs

- A spec reaches a page through a `to*` method in `flows/<domain>/journey.ts`, not through its own clicks.
- A sequence used by two tests becomes a `to*` method in that file. Delete the local copies when you add it.
- Never seed a journey spec. Seed only the set-up for a one-page assertion; walk everything else through the pages.
- Copy test data from real canned data (the service's fixtures, reference data, the stub). Never invent it.
- Import a value that has a home rather than retyping it. A value specific to a test can be typed inline; give it a home once copies spread.
- Never pipe a test run. Redirect it to a file and read the file.

## Journey answers (animals)

- `journey.ts` drives pages and holds no values. What a user says is plain data in the `journey-` files in `domain/<domain>/constants/`.
- Answers come in named sets: the mandatory set (a missing answer is a compile error) and the full set. A spec starts from a set and overrides single values only where the test needs them, e.g. `{ ...MANDATORY_ANSWERS, unweanedAnimals: yesNoValues.yes }`. It never changes `journey.ts` to get a different value.
- An answer states a fact, never how it is entered. By default the UI and seeded journeys build from the same answers.
- A new field touches one answer type and the step that enters it.

## Journey answers (plants)

- Answers still live in `flows/plants/journey.ts` until plants moves to the animals pattern.

## Code quality

- A comment describes only the lines below it, and only when a name or extraction cannot.
- No ticket keys, backlog or ruling ids, release names or session words in comments or test titles. `npm run lint` enforces this, and the silent-catch and error-log rules, through `eslint-rules/code-quality.js`. That file is the same file as in the Node frontends, so Prettier skips it here; change it there first and copy it across.
- No history: no before/after narration, no `REMOVED_*`, no "renamed from".
- A name predicts its return value and side effects. One concept, one name. A rename covers the whole vocabulary.
- Set-up used by two tests goes in the shared helper. Promoting a helper deletes the local copies.
- A test title states what its assertions prove. A test must fail without the change it covers.

Canonical text: `.claude/rules/code-quality.md` in the trade-imports-workspace repo.

## Before you commit

Run `npm run lint`, `npm run format:check` and `npm run typecheck`.

# trade-imports-ins-tests: agent notes

Playwright end-to-end, accessibility and security suite for the trade imports services. One Playwright project per domain: `animals`, `animals-admin`, `ins` and `plants`. See [README.md](README.md) for set-up and every run command.

## Layout

| Folder           | Holds                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| `tests/<domain>` | The specs                                                                      |
| `flows/<domain>` | Multi-page sequences: `journey.ts` `to*` methods and the actions built on them |
| `page-objects`   | One class per page: locators and single-page actions                           |
| `domain`         | Constants, models and fixtures shared by specs                                 |
| `fixtures`       | Playwright fixtures that hand specs their pages, flows and API clients         |

## Writing specs

- A spec reaches a page through a `to*` method in `flows/<domain>/journey.ts`, not through its own clicks.
- A sequence used by two tests becomes a `to*` method in that file. Delete the local copies when you add it.
- Never seed a journey spec. Seed only the set-up for a one-page assertion; walk everything else through the pages.
- Copy test data from real canned data (the service's fixtures, reference data, the stub). Never invent it.
- Import commodity types, lines and addresses from the flow file rather than redefining them.
- Never pipe a test run. Redirect it to a file and read the file.

## Code quality

- A comment describes only the lines below it, and only when a name or extraction cannot.
- No ticket keys, backlog or ruling ids, release names or session words in comments or test titles. `npm run lint` enforces this (`eslint-rules/no-ticket-or-session-vocabulary.mjs`).
- No history: no before/after narration, no `REMOVED_*`, no "renamed from".
- A name predicts its return value and side effects. One concept, one name. A rename covers the whole vocabulary.
- Set-up used by two tests goes in the shared helper. Promoting a helper deletes the local copies.
- A test title states what its assertions prove. A test must fail without the change it covers.

Canonical text: `.claude/rules/code-quality.md` in the trade-imports-workspace repo.

## Before you commit

Run `npm run lint`, `npm run format:check` and `npm run typecheck`.

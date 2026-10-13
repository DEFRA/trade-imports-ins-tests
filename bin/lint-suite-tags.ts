/**
 * Fails when a spec's tags disagree with the test suite directory it lives in.
 *
 * Test suites are selected by tag, not by directory: `npm test` runs a domain's
 * whole directory minus `@a11y`, `@active`, `@compose` and `@dynamics`. So a
 * spec under security/ without `@active` would run in every e2e and PR check,
 * and one under a11y/ without `@a11y` would run in e2e and be missed by the
 * a11y suite. The rules, for tests/<domain>/<suite>/:
 *
 *     a11y/      every test carries @a11y
 *     security/  every test carries @active
 *     e2e/       no test carries @a11y or @active
 *
 * Asks Playwright to list the tests, so it sees the tags a test really has
 * (title, describe and test tags merged). Needs no stack, sign-in or browser.
 *
 *     npm run lint:suite-tags
 */
import { execFileSync } from 'node:child_process';

type Spec = { title: string; file: string; line: number; tags: string[] };
type Suite = { specs?: Spec[]; suites?: Suite[] };

const SUITE_TAG: Record<string, string> = { a11y: 'a11y', security: 'active' };
const SUITE_TAGS = Object.values(SUITE_TAG);

const MAX_LIST_BYTES = 64 * 1024 * 1024;

const listSpecs = (): Spec[] => {
  const json = execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json', '--config=playwright.docker-compose.config.ts'], {
    encoding: 'utf8',
    maxBuffer: MAX_LIST_BYTES,
  });
  const collect = ({ specs = [], suites = [] }: Suite): Spec[] => [...specs, ...suites.flatMap(collect)];
  return collect(JSON.parse(json) as Suite);
};

// The JSON reporter may or may not keep the leading @.
const tagNames = (spec: Spec): string[] => spec.tags.map((tag) => tag.replace(/^@/, ''));

const problemsWith = (spec: Spec): string[] => {
  const [domain, suite] = spec.file.split('/');
  const tags = tagNames(spec);
  const required = SUITE_TAG[suite];
  if (required) {
    return tags.includes(required) ? [] : [`needs @${required} (it is under ${domain}/${suite}/)`];
  }
  return SUITE_TAGS.filter((tag) => tags.includes(tag)).map((tag) => `must not carry @${tag} (it is under ${domain}/${suite}/)`);
};

const specs = listSpecs();
const failures = specs.flatMap((spec) =>
  problemsWith(spec).map((problem) => `  tests/${spec.file}:${spec.line}  ${spec.title}\n      ${problem}`),
);

if (failures.length > 0) {
  console.error(`${failures.length} test(s) have tags that do not match their suite directory:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`Suite tags match their directories (${specs.length} tests checked).`);

/**
 * Fails when a spec's tags disagree with the test type directory it lives in.
 *
 * Test types are selected by tag, not by directory: `npm test` runs a domain's
 * whole directory minus `@a11y`, `@active`, `@compose` and `@dynamics`. So a
 * spec under security/ without `@active` would run in every e2e and PR check,
 * and one under a11y/ without `@a11y` would run in e2e and be missed by the
 * a11y run. The rules, for tests/<domain>/<type>/:
 *
 *     a11y/      every test carries @a11y
 *     security/  every test carries @active
 *     e2e/       no test carries @a11y or @active
 *
 * It also checks the service tags (config/service-tags.ts) that GitHub Actions
 * uses to pick extra specs for a service's pull request: a spec must not carry
 * the tag of the domain it sits in.
 *
 * Asks Playwright to list the tests, so it sees the tags a test really has
 * (title, describe and test tags merged). Needs no stack, sign-in or browser.
 *
 *     npm run lint:suite-tags
 */
import { execFileSync } from 'node:child_process';
import { SERVICE_TAG_DOMAINS } from '@config/service-tags';

type Spec = { title: string; file: string; line: number; tags: string[] };
type Suite = { specs?: Spec[]; suites?: Suite[] };

const TYPE_TAG: Record<string, string> = { a11y: 'a11y', security: 'active' };
const TYPE_TAGS = Object.values(TYPE_TAG);

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

// A spec's type tag must match its test type directory.
const testTypeViolations = (spec: Spec): string[] => {
  const [domain, type] = spec.file.split('/');
  const tags = tagNames(spec);
  const required = TYPE_TAG[type];
  if (required) {
    return tags.includes(required) ? [] : [`needs @${required} (it is under ${domain}/${type}/)`];
  }
  return TYPE_TAGS.filter((tag) => tags.includes(tag)).map((tag) => `must not carry @${tag} (it is under ${domain}/${type}/)`);
};

// A spec must not carry a service tag for the domain it sits in; that domain already runs by path.
const serviceTagViolations = (spec: Spec): string[] => {
  const [domain] = spec.file.split('/');
  const tags = tagNames(spec);
  return Object.entries(SERVICE_TAG_DOMAINS)
    .filter(([tag, domains]) => domains.includes(domain) && tags.includes(tag.replace(/^@/, '')))
    .map(([tag]) => `must not carry ${tag} (it is under ${domain}/, which that service already runs)`);
};

const violationsOf = (spec: Spec): string[] => [...testTypeViolations(spec), ...serviceTagViolations(spec)];

const specs = listSpecs();
const failures = specs.flatMap((spec) =>
  violationsOf(spec).map((violation) => `  tests/${spec.file}:${spec.line}  ${spec.title}\n      ${violation}`),
);

if (failures.length > 0) {
  console.error(`${failures.length} test(s) have tags that do not fit where they live:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`Tags fit where their tests live (${specs.length} tests checked).`);

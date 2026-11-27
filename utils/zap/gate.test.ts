import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { groupAlertsBySite, parseRules, resolveAction, type ZapAlert } from '@utils/zap/gate';

const ANIMALS_FRONTEND = 'http://localhost:3000';
const INS_FRONTEND = 'http://localhost:3002';

const LOW_CONFIDENCE = '1';
const HIGH_CONFIDENCE = '3';

const sqlInjection = (confidence: string): ZapAlert => ({ pluginid: '40018', riskcode: '3', confidence });

const tsv = (...lines: string[][]): string => lines.map((columns) => columns.join('\t')).join('\n');

describe('parseRules', () => {
  it('reads a three-column rule as applying to every site and confidence', () => {
    assert.deepEqual(parseRules(tsv(['10096', 'IGNORE', '(Timestamp Disclosure)'])), [{ ruleId: '10096', action: 'IGNORE' }]);
  });

  it('reads the site and confidence columns, with an empty site meaning every site', () => {
    const rules = parseRules(
      tsv(['40018', 'IGNORE', '(SQL Injection)', ANIMALS_FRONTEND, 'Low'], ['6', 'WARN', '(Path Traversal)', '', 'High']),
    );

    assert.deepEqual(rules, [
      { ruleId: '40018', action: 'IGNORE', siteName: ANIMALS_FRONTEND, confidence: LOW_CONFIDENCE },
      { ruleId: '6', action: 'WARN', confidence: HIGH_CONFIDENCE },
    ]);
  });

  it('skips comments, blank lines and lines with no action', () => {
    assert.deepEqual(parseRules(['# 10015\tWARN\t(example)', '', '10015\tMAYBE\t(typo)'].join('\n')), []);
  });

  it('reads every rule in zap/rules.tsv', async () => {
    const content = await readFile(new URL('../../zap/rules.tsv', import.meta.url), 'utf8');
    const ruleLines = content.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));

    assert.equal(parseRules(content).length, ruleLines.length);
  });

  it('refuses a confidence ZAP does not use', () => {
    assert.throws(() => parseRules(tsv(['40018', 'IGNORE', '(SQL Injection)', ANIMALS_FRONTEND, 'low'])), /confidence "low"/);
  });
});

describe('resolveAction', () => {
  const lowConfidenceIgnoreOnAnimals = parseRules(tsv(['40018', 'IGNORE', '(SQL Injection)', ANIMALS_FRONTEND, 'Low']));

  it('ignores a Low-confidence alert on the site and confidence the rule names', () => {
    assert.equal(resolveAction(sqlInjection(LOW_CONFIDENCE), ANIMALS_FRONTEND, lowConfidenceIgnoreOnAnimals), 'IGNORE');
  });

  it('fails a High-confidence alert of the same plugin on the same site', () => {
    assert.equal(resolveAction(sqlInjection(HIGH_CONFIDENCE), ANIMALS_FRONTEND, lowConfidenceIgnoreOnAnimals), 'FAIL');
  });

  it('fails a Low-confidence alert of the same plugin on another site', () => {
    assert.equal(resolveAction(sqlInjection(LOW_CONFIDENCE), INS_FRONTEND, lowConfidenceIgnoreOnAnimals), 'FAIL');
  });

  it('applies a three-column rule on every site at every confidence', () => {
    const rules = parseRules(tsv(['40018', 'WARN', '(SQL Injection)']));

    assert.equal(resolveAction(sqlInjection(HIGH_CONFIDENCE), INS_FRONTEND, rules), 'WARN');
  });

  it('prefers the rule naming a site over one naming only a confidence', () => {
    const rules = parseRules(
      tsv(['40018', 'FAIL', '(SQL Injection)', '', 'Low'], ['40018', 'IGNORE', '(SQL Injection)', ANIMALS_FRONTEND]),
    );

    assert.equal(resolveAction(sqlInjection(LOW_CONFIDENCE), ANIMALS_FRONTEND, rules), 'IGNORE');
  });

  it('prefers the rule naming a site and confidence over one naming the site only', () => {
    const rules = parseRules(
      tsv(['40018', 'FAIL', '(SQL Injection)', ANIMALS_FRONTEND], ['40018', 'IGNORE', '(SQL Injection)', ANIMALS_FRONTEND, 'Low']),
    );

    assert.equal(resolveAction(sqlInjection(LOW_CONFIDENCE), ANIMALS_FRONTEND, rules), 'IGNORE');
    assert.equal(resolveAction(sqlInjection(HIGH_CONFIDENCE), ANIMALS_FRONTEND, rules), 'FAIL');
  });

  it('fails an unlisted High-risk alert and warns on an unlisted Medium one', () => {
    assert.equal(resolveAction(sqlInjection(LOW_CONFIDENCE), ANIMALS_FRONTEND, []), 'FAIL');
    assert.equal(resolveAction({ pluginid: '10020', riskcode: '2', confidence: '2' }, ANIMALS_FRONTEND, []), 'WARN');
  });
});

describe('groupAlertsBySite', () => {
  it('merges nodes with one site name and keeps an alert listed under both once', () => {
    const sites = groupAlertsBySite({
      site: [
        { '@name': INS_FRONTEND, alerts: [sqlInjection(LOW_CONFIDENCE)] },
        { '@name': ANIMALS_FRONTEND, alerts: [sqlInjection(LOW_CONFIDENCE)] },
        { '@name': INS_FRONTEND, alerts: [sqlInjection(LOW_CONFIDENCE)] },
      ],
    });

    assert.deepEqual(sites, [
      { siteName: ANIMALS_FRONTEND, alerts: [sqlInjection(LOW_CONFIDENCE)] },
      { siteName: INS_FRONTEND, alerts: [sqlInjection(LOW_CONFIDENCE)] },
    ]);
  });

  it('keeps alerts of one plugin at two confidences apart', () => {
    const [site] = groupAlertsBySite({
      site: [{ '@name': ANIMALS_FRONTEND, alerts: [sqlInjection(LOW_CONFIDENCE), sqlInjection(HIGH_CONFIDENCE)] }],
    });

    assert.deepEqual(site.alerts, [sqlInjection(LOW_CONFIDENCE), sqlInjection(HIGH_CONFIDENCE)]);
  });
});

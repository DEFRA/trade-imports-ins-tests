export type RuleAction = 'IGNORE' | 'WARN' | 'FAIL';

export interface ZapAlert {
  pluginid: string;
  alert?: string;
  name?: string;
  riskcode: string;
  // ZAP's confidence code: 0 False Positive, 1 Low, 2 Medium, 3 High, 4 Confirmed.
  confidence?: string;
  riskdesc?: string;
  // ZAP's own occurrence count for this alert type — how many pages/
  // requests it was found on, not how many distinct alert types exist.
  count?: string;
}

export interface ZapReport {
  site?: Array<{ '@name'?: string; alerts?: ZapAlert[] }>;
}

export interface SiteAlerts {
  siteName: string;
  alerts: ZapAlert[];
}

/**
 * Groups a ZAP report's alerts by site name, sorted by name. A site ZAP split
 * into several nodes becomes one, and an alert listed under more than one of
 * them is kept once: the same plugin, risk and confidence is one alert.
 */
export function groupAlertsBySite(report: ZapReport): SiteAlerts[] {
  const groups = new Map<string, Map<string, ZapAlert>>();
  for (const site of report.site ?? []) {
    const siteName = site['@name'] ?? 'unknown';
    const group = groups.get(siteName) ?? new Map<string, ZapAlert>();
    groups.set(siteName, group);
    for (const alert of site.alerts ?? []) {
      const alertKey = `${alert.pluginid}|${alert.riskcode}|${alert.confidence}`;
      if (!group.has(alertKey)) group.set(alertKey, alert);
    }
  }

  return [...groups.entries()]
    .map(([siteName, alertMap]) => ({ siteName, alerts: [...alertMap.values()] }))
    .sort((a, b) => a.siteName.localeCompare(b.siteName));
}

export interface Rule {
  ruleId: string;
  action: RuleAction;
  siteName?: string;
  confidence?: string;
}

const CONFIDENCE_CODES: Record<string, string> = { Low: '1', Medium: '2', High: '3', Confirmed: '4' };

const isRuleAction = (value: string | undefined): value is RuleAction => value === 'IGNORE' || value === 'WARN' || value === 'FAIL';

/**
 * Parses the rules in a zap/rules.tsv file's content.
 * @throws {Error} when a rule names a confidence ZAP does not use.
 */
export function parseRules(content: string): Rule[] {
  const rules: Rule[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [ruleId, action, , siteName, confidenceName] = trimmed.split('\t').map((column) => column.trim());
    if (!ruleId || !isRuleAction(action)) continue;
    const rule: Rule = { ruleId, action };
    if (siteName) rule.siteName = siteName;
    if (confidenceName) {
      const confidence = CONFIDENCE_CODES[confidenceName];
      if (!confidence) {
        throw new Error(
          `zap/rules.tsv: rule ${ruleId} has confidence "${confidenceName}"; use one of ${Object.keys(CONFIDENCE_CODES).join(', ')}`,
        );
      }
      rule.confidence = confidence;
    }
    rules.push(rule);
  }
  return rules;
}

const matches = (rule: Rule, alert: ZapAlert, siteName: string): boolean =>
  rule.ruleId === alert.pluginid &&
  (rule.siteName === undefined || rule.siteName === siteName) &&
  (rule.confidence === undefined || rule.confidence === alert.confidence);

const specificity = (rule: Rule): number => (rule.siteName ? 2 : 0) + (rule.confidence ? 1 : 0);

export function resolveAction(alert: ZapAlert, siteName: string, rules: readonly Rule[]): RuleAction {
  const configured = rules
    .filter((rule) => matches(rule, alert, siteName))
    .reduce<Rule | undefined>((best, rule) => (best && specificity(best) >= specificity(rule) ? best : rule), undefined);
  if (configured) return configured.action;
  // Unclassified High-risk (riskcode 3) defaults to FAIL, else WARN — High
  // is the least noisy risk tier, the safest bar for a new, unproven gate.
  // Escalate individual Medium findings via rules.tsv as they're triaged.
  return Number(alert.riskcode) === 3 ? 'FAIL' : 'WARN';
}

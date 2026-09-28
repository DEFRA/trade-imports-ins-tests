import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { planContexts } from '@utils/zap/check-context-sync';
import { createZapClient, runAutomationPlan, type ZapClient } from '@utils/zap/client';
import { zapAutomationPlan, zapProfile } from '@config/zap';

const pathFromHere = (relativePath: string): string => fileURLToPath(new URL(relativePath, import.meta.url));

const RULES_FILE = pathFromHere('../../zap/rules.tsv');
// zap-report/ is bind-mounted into the ZAP container (see
// docker/stack/security.compose.yml) so ZAP's report job and this
// host-side read see the same files.
const REPORT_DIR = pathFromHere('../../zap-report');
// shared-config.ts's html reporter always writes here (no outputFolder
// override, either config) — nested under REPORT_DIR below so it publishes
// alongside everything else, with no separate S3 path needed on CDP.
const PLAYWRIGHT_REPORT_DIR = pathFromHere('../../playwright-report');
// Matches reportFile in automation-*.yaml — one combined report
// covering every site ZAP touched this run.
const REPORT_NAME = 'security-scan';
// CDP's report viewer 403s anything that isn't .html, and GitHub Actions'
// staticrypt password gate (security-active-scan.yml) only wraps .html
// files — so ZAP's own log and its JSON report both get escaped into a
// minimal <pre> page under these names rather than published as-is.
// Linked from index.html below; see wrapAsHtml.
const ZAP_LOG_ARTEFACT = 'zap-log.html';
const JSON_REPORT_ARTEFACT = `${REPORT_NAME}-json.html`;

type RuleAction = 'IGNORE' | 'WARN' | 'FAIL';

interface ZapAlert {
  pluginid: string;
  alert?: string;
  name?: string;
  riskcode: string;
  riskdesc?: string;
  // ZAP's own occurrence count for this alert type — how many pages/
  // requests it was found on, not how many distinct alert types exist.
  count?: string;
}

interface ZapReport {
  site?: Array<{ '@name'?: string; alerts?: ZapAlert[] }>;
}

// zap/rules.tsv — OWASP's own convention (from zap-baseline.py/
// zap-full-scan.py): <ruleId>\t<IGNORE|WARN|FAIL>\t(comment).
async function loadRules(): Promise<Map<string, RuleAction>> {
  const rules = new Map<string, RuleAction>();
  let content: string;
  try {
    content = await fs.readFile(RULES_FILE, 'utf8');
  } catch {
    return rules;
  }

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [ruleId, action] = trimmed.split('\t');
    if (ruleId && (action === 'IGNORE' || action === 'WARN' || action === 'FAIL')) {
      rules.set(ruleId.trim(), action);
    }
  }
  return rules;
}

function resolveAction(alert: ZapAlert, rules: Map<string, RuleAction>): RuleAction {
  const configured = rules.get(alert.pluginid);
  if (configured) return configured;
  // Unclassified High-risk (riskcode 3) defaults to FAIL, else WARN — High
  // is the least noisy risk tier, the safest bar for a new, unproven gate.
  // Escalate individual Medium findings via rules.tsv as they're triaged.
  return Number(alert.riskcode) === 3 ? 'FAIL' : 'WARN';
}

interface SiteAlerts {
  siteName: string;
  alerts: ZapAlert[];
}

// ZAP's site tree can split the same host into more than one <site> node
// (seen locally: two entries both named http://localhost:8085) — group by
// name and dedupe by pluginid within each group so a finding recorded
// under both nodes isn't double-counted, while the same pluginid on two
// genuinely different hosts still counts separately. Both the site names
// and the alerts come entirely from the report itself — nothing here is
// cross-referenced against the ZAP_TRADE_IMPORTS_*_URL env vars.
async function loadReportSites(): Promise<SiteAlerts[]> {
  const reportPath = path.join(REPORT_DIR, `${REPORT_NAME}.json`);
  const content = await fs.readFile(reportPath, 'utf8');
  const report = JSON.parse(content) as ZapReport;

  const groups = new Map<string, Map<string, ZapAlert>>();
  for (const site of report.site ?? []) {
    const siteName = site['@name'] ?? 'unknown';
    const group = groups.get(siteName) ?? new Map<string, ZapAlert>();
    groups.set(siteName, group);
    for (const alert of site.alerts ?? []) {
      if (!group.has(alert.pluginid)) group.set(alert.pluginid, alert);
    }
  }

  return [...groups.entries()]
    .map(([siteName, alertMap]) => ({ siteName, alerts: [...alertMap.values()] }))
    .sort((a, b) => a.siteName.localeCompare(b.siteName));
}

// ZAP's own riskcode convention (see resolveAction's High-risk check below).
const RISK_LABELS: Record<string, string> = { '3': 'High', '2': 'Medium', '1': 'Low', '0': 'Informational' };

interface SiteSummary {
  siteName: string;
  counts: Record<string, number>;
  failCount: number;
  messageCount: number;
}

function summariseSite(site: SiteAlerts, rules: Map<string, RuleAction>, messageCount: number): SiteSummary {
  const counts: Record<string, number> = { High: 0, Medium: 0, Low: 0, Informational: 0 };
  let failCount = 0;
  for (const alert of site.alerts) {
    const label = RISK_LABELS[alert.riskcode] ?? 'Informational';
    counts[label] += Number(alert.count ?? 1);
    // Gated per alert type, not per instance — an 81-instance finding that
    // fails the gate is one thing to fix, not 81.
    if (resolveAction(alert, rules) === 'FAIL') failCount += 1;
  }
  return { siteName: site.siteName, counts, failCount, messageCount };
}

// Traffic volume, not an alert — reassurance that a site with few/no
// alerts was actually reached through the proxy rather than silently
// skipped. Queried live from ZAP rather than the static report, which
// doesn't carry message counts at all.
async function getMessageCount(client: ZapClient, siteName: string): Promise<number> {
  const { numberOfMessages } = await client.core.numberOfMessages({ baseurl: siteName });
  return Number(numberOfMessages);
}

/**
 * Fails the run when a declared context recorded no traffic — the one failure
 * mode that looks like success, since no requests means no site-tree node, no
 * alerts, and a clean-looking report section. Catches a context nothing drives,
 * a spec dropped from the corpus, and the quiet case where the API clients stop
 * inheriting `use.proxy` from Playwright's own `request` fixture.
 *
 * Reads the plan rather than the report: a context with no traffic is absent
 * from the report entirely, so the report cannot be asked what is missing.
 */
async function findContextsWithNoTraffic(client: ZapClient): Promise<string[]> {
  const contexts = await planContexts();
  const empty: string[] = [];
  for (const { name, urls } of contexts) {
    const counts = await Promise.all(urls.map((url) => getMessageCount(client, url)));
    if (counts.every((count) => count === 0)) {
      empty.push(`${name} (${urls.join(', ')})`);
    }
  }
  return empty;
}

// Escapes sourceName's content and wraps it in a minimal HTML page under
// targetName, both relative to REPORT_DIR — see ZAP_LOG_ARTEFACT and
// JSON_REPORT_ARTEFACT above for why. Silently no-ops if sourceName isn't
// there: true on CDP for zap.log specifically, which isn't written to
// REPORT_DIR until entrypoint.sh copies it in after this script has
// already run (ZAP itself is still running at this point, so its log
// isn't complete yet — entrypoint.sh writes the real zap-log.html once
// it is).
async function wrapAsHtml(sourceName: string, targetName: string): Promise<void> {
  try {
    const content = await fs.readFile(path.join(REPORT_DIR, sourceName), 'utf8');
    const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    await fs.writeFile(
      path.join(REPORT_DIR, targetName),
      `<!doctype html><meta charset="utf-8"><title>${sourceName}</title><pre>${escaped}</pre>`,
      'utf8',
    );
  } catch {
    console.error(`could not wrap ${sourceName} as HTML`);
  }
}

// CDP's own "Report" link is driven by whichever directory gets published —
// it looks for index.html inside it (see entrypoint.sh). This is that
// landing page: one row per site the report covers, so anyone fixing a
// finding in app code can see which host it's on. It's one combined file
// covering every site, so the file links themselves live once in their own
// table below, not repeated per row.
async function writeIndexHtml(
  summaries: SiteSummary[],
  truncatedScans: string[],
  failed: boolean,
  started: string,
  finished: string,
  specsOutcome: string | undefined,
): Promise<void> {
  const rows = summaries
    .map(
      (s) => `
        <tr>
          <td>${s.siteName}</td>
          <td class="${s.failCount > 0 ? 'fail' : 'pass'}">${s.failCount > 0 ? 'FAIL' : 'pass'}</td>
          <td>${s.messageCount}</td>
          <td>${s.counts.High}</td>
          <td>${s.counts.Medium}</td>
          <td>${s.counts.Low}</td>
          <td>${s.counts.Informational}</td>
        </tr>`,
    )
    .join('');

  const totals = summaries.reduce(
    (acc, s) => ({
      Messages: acc.Messages + s.messageCount,
      High: acc.High + s.counts.High,
      Medium: acc.Medium + s.counts.Medium,
      Low: acc.Low + s.counts.Low,
      Informational: acc.Informational + s.counts.Informational,
    }),
    { Messages: 0, High: 0, Medium: 0, Low: 0, Informational: 0 },
  );

  const truncationSection =
    truncatedScans.length > 0
      ? `<div class="callout"><h2 class="fail">Truncated scans</h2><ul>${truncatedScans.map((w) => `<li>${w}</li>`).join('')}</ul></div>`
      : '';

  // Undefined outside the GitHub Action (local, CDP): those lanes either
  // never reach here on a failed run (CDP's && short-circuit) or aren't
  // gated on partial traffic to begin with. 'success' is the only outcome
  // that means every @active spec actually ran.
  const partialRunSection =
    specsOutcome && specsOutcome !== 'success'
      ? `<div class="callout"><h2 class="fail">Partial run</h2><p>The traffic-generation specs did not all succeed (outcome: ${specsOutcome}) — the findings below reflect whatever traffic ran before that, not full corpus coverage.</p></div>`
      : '';

  await wrapAsHtml('zap.log', ZAP_LOG_ARTEFACT);
  await wrapAsHtml(`${REPORT_NAME}.json`, JSON_REPORT_ARTEFACT);

  // Copied whole, not just index.html: Playwright's HTML report embeds test
  // results inline, but attachments (screenshots, traces) sit alongside it
  // in data/ and would 404 without it. Publishing it is just a matter of
  // it existing under REPORT_DIR before entrypoint.sh's one upload step —
  // same for every environment.
  try {
    await fs.cp(PLAYWRIGHT_REPORT_DIR, path.join(REPORT_DIR, 'playwright-report'), { recursive: true });
  } catch {
    console.error(`could not copy Playwright's own report from ${PLAYWRIGHT_REPORT_DIR}`);
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="color-scheme" content="light dark" />
<title>ZAP security scan — ${failed ? 'FAILED' : 'passed'}</title>
<style>
:root {
  --bg: #ffffff;
  --text: #1a1a1a;
  --border: #ccc;
  --th-bg: #f0f0f0;
  --fail: #b30000;
  --fail-bg: #fdecea;
  --pass: #007a3d;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --text: #e0e0e0;
    --border: #444;
    --th-bg: #2a2a2a;
    --fail: #ff6b6b;
    --fail-bg: #3a1f1f;
    --pass: #4caf80;
  }
}
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  margin: 2rem;
  background: var(--bg);
  color: var(--text);
}
h2 { font-size: 1rem; margin: 2rem 0 0.5rem; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid var(--border); padding: 0.5rem; text-align: left; }
th { background: var(--th-bg); }
tfoot td { font-weight: bold; border-top: 2px solid var(--border); }
.fail { color: var(--fail); }
.pass { color: var(--pass); }
.callout { border: 1px solid var(--fail); background: var(--fail-bg); border-radius: 4px; padding: 0.75rem 1rem; margin: 1rem 0; }
.callout h2 { margin: 0 0 0.5rem; }
.callout p, .callout ul { margin: 0; }
</style>
</head>
<body>
<h1>ZAP security scan — <span class="${failed ? 'fail' : 'pass'}">${failed ? 'FAILED' : 'passed'}</span></h1>
<p>profile: ${zapProfile}</p>
<p>started: ${started}</p>
<p>finished: ${finished}</p>
${truncationSection}
${partialRunSection}
<h2>Sites</h2>
<table>
<thead>
<tr>
  <th rowspan="2">Site</th>
  <th rowspan="2">Result</th>
  <th>Traffic</th>
  <th colspan="4">Alerts</th>
</tr>
<tr>
  <th>Messages</th>
  <th>High</th>
  <th>Medium</th>
  <th>Low</th>
  <th>Informational</th>
</tr>
</thead>
<tbody>${rows}</tbody>
<tfoot>
<tr>
  <td>Total</td>
  <td>—</td>
  <td>${totals.Messages}</td>
  <td>${totals.High}</td>
  <td>${totals.Medium}</td>
  <td>${totals.Low}</td>
  <td>${totals.Informational}</td>
</tr>
</tfoot>
</table>
<h2>Artefacts</h2>
<table>
<thead><tr><th>File</th><th>Description</th></tr></thead>
<tbody>
<tr><td><a href="${REPORT_NAME}.html">${REPORT_NAME}.html</a></td><td>Full alert detail for every site above, human-readable</td></tr>
<tr><td><a href="${JSON_REPORT_ARTEFACT}">${REPORT_NAME}.json</a></td><td>The same alert detail, machine-readable</td></tr>
<tr><td><a href="playwright-report/index.html">playwright-report</a></td><td>The Playwright run itself — specs, steps, and any screenshots/traces</td></tr>
<tr><td><a href="${ZAP_LOG_ARTEFACT}">zap.log</a></td><td>ZAP's own internal diagnostics, not the alert reports above</td></tr>
</tbody>
</table>
</body>
</html>
`;

  await fs.writeFile(path.join(REPORT_DIR, 'index.html'), html, 'utf8');
}

// Must match maxScanDurationInMins in automation-active.yaml (all
// activeScan jobs — the passive plan has none, so this simply never
// matches there). A scan that finished at (or within a few seconds of)
// this ceiling almost certainly got cut off mid-way rather than completing
// naturally — an incomplete scan reporting "no findings" is a false clean,
// not a real one, so this is treated as a hard failure rather than a
// warning. If it fires for real, the fix is to raise the cap, not to
// ignore it.
//
// 60 is ~4.5x the slowest context measured (frontend 13m27s; 21m across all
// five). See automation-active.yaml's frontend job for the headroom reasoning.
const ACTIVE_SCAN_CAP_MINS = 60;
const TRUNCATION_TOLERANCE_MINS = 0.5;

function findTruncatedActiveScans(info: string[]): string[] {
  const pattern = /^Job activeScan finished, time taken: (\d+):(\d+):(\d+)$/;
  return info.filter((line) => {
    const match = pattern.exec(line);
    if (!match) return false;
    const [, hours, minutes, seconds] = match;
    const totalMins = Number(hours) * 60 + Number(minutes) + Number(seconds) / 60;
    return totalMins >= ACTIVE_SCAN_CAP_MINS - TRUNCATION_TOLERANCE_MINS;
  });
}

async function main(): Promise<void> {
  const client = createZapClient();
  const progress = await runAutomationPlan(client, zapAutomationPlan);

  const failures: string[] = [];

  const truncatedScans = findTruncatedActiveScans(progress.info);
  if (truncatedScans.length > 0) {
    failures.push(
      `Active scan hit its ${ACTIVE_SCAN_CAP_MINS}-minute cap and was likely cut short before covering everything — increase maxScanDurationInMins in automation-active.yaml, don't treat this as a clean scan: ${truncatedScans.join('; ')}`,
    );
  }

  const contextsWithNoTraffic = zapProfile === 'active' ? await findContextsWithNoTraffic(client) : [];
  if (contextsWithNoTraffic.length > 0) {
    failures.push(
      `No traffic reached ${contextsWithNoTraffic.length} declared context(s), so their activeScan jobs scanned nothing and reported clean — drive them from a spec, or drop them from the plans: ${contextsWithNoTraffic.join('; ')}`,
    );
  }

  const rules = await loadRules();
  const sites = await loadReportSites();
  const summaries = await Promise.all(sites.map(async (site) => summariseSite(site, rules, await getMessageCount(client, site.siteName))));

  for (const site of sites) {
    for (const alert of site.alerts) {
      if (resolveAction(alert, rules) === 'FAIL') {
        const description = alert.alert ?? alert.name ?? 'unknown alert';
        failures.push(`[${site.siteName}] ${alert.pluginid} ${description} (${alert.riskdesc ?? alert.riskcode})`);
      }
    }
  }

  // Written before the throw below, not after — a failing run is exactly
  // when someone most needs the report, and entrypoint.sh's publish step
  // runs regardless of this script's exit code, so the index has to exist
  // on disk either way.
  await writeIndexHtml(summaries, truncatedScans, failures.length > 0, progress.started, progress.finished, process.env.PLAYWRIGHT_OUTCOME);

  if (failures.length > 0) {
    throw new Error(`ZAP security scan found ${failures.length} failure(s):\n${failures.join('\n')}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

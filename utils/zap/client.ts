import ZAPClient, { type ZapPlanProgress } from 'zaproxy';
import { zapApiKey, zapPort } from '@config/zap';

export type { ZapPlanProgress } from 'zaproxy';
export type ZapClient = ZAPClient;

// zaproxy sends API requests *through* ZAP as an HTTP proxy (axios `proxy`
// option), not to a base URL — ZAP's API and proxy share the same host:port.
export function createZapClient(): ZapClient {
  return new ZAPClient({
    apiKey: zapApiKey,
    proxy: { host: 'localhost', port: Number(zapPort) },
  });
}

const PLAN_POLL_INTERVAL_MS = 2_000;
// Headroom over the plan's worst case: every app's activeScan cap
// (automation-active.yaml — the passive plan has none) plus
// passive-wait/delay/report overhead. A safety ceiling on the whole run,
// not a coverage cap — see run-and-gate.ts for that check.
const PLAN_TIMEOUT_MS = 5 * 60 * 60 * 1000;

// Runs against the already-running daemon via automation's runPlan, not
// `zap.sh -cmd -autorun` (which would start a fresh ZAP with an empty site
// tree) — this one sees what passive scanning already captured. Returns the
// final progress so the caller can check for truncated jobs.
export async function runAutomationPlan(client: ZapClient, planFilePath: string): Promise<ZapPlanProgress> {
  const { planId } = await client.automation.runPlan({ filepath: planFilePath });

  const start = Date.now();
  while (Date.now() - start < PLAN_TIMEOUT_MS) {
    const progress = await client.automation.planProgress({ planid: planId });
    // `finished` is an ISO timestamp string once done, '' while still running.
    if (progress.finished !== '') {
      if (progress.error.length > 0) {
        throw new Error(`ZAP automation plan finished with errors: ${progress.error.join('; ')}`);
      }
      return progress;
    }
    await new Promise((resolve) => setTimeout(resolve, PLAN_POLL_INTERVAL_MS));
  }
  throw new Error(`ZAP automation plan did not finish within ${PLAN_TIMEOUT_MS}ms`);
}

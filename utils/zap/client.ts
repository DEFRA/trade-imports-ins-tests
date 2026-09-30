import http from 'node:http';
import { zapApiKey, zapPort } from '@config/zap';

// Flat response, not nested — and `finished` is an ISO timestamp string
// once the plan completes, empty string ('') while still running.
export interface ZapPlanProgress {
  planId: number;
  started: string;
  finished: string;
  error: string[];
  warn: string[];
  info: string[];
}

export type ZapClient = {
  automation: {
    runPlan(args: { filepath: string }): Promise<{ planId: string }>;
    planProgress(args: { planid: string }): Promise<ZapPlanProgress>;
  };
  core: {
    // ZAP's API returns counts as strings, not numbers — same convention
    // as ZapAlert's riskcode/count elsewhere in this repo.
    numberOfMessages(args: { baseurl?: string }): Promise<{ numberOfMessages: string }>;
  };
};

// Dedicated agent with no proxyEnv so CDP's HTTP_PROXY / --use-env-proxy
// cannot redirect these loopback API calls.
const zapAgent = new http.Agent();

// Call ZAP's JSON API directly on the daemon port. The old `zaproxy` npm
// client sent Host: zap through an axios proxy to localhost — Node 24
// rejects that Host/authority mismatch (seen on CDP at prime-context).
function zapRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`http://127.0.0.1:${zapPort}/JSON${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return new Promise((resolve, reject) => {
    const req = http.get(
      url,
      {
        headers: { 'X-ZAP-API-Key': zapApiKey },
        agent: zapAgent,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode !== undefined && res.statusCode >= 400) {
            reject(new Error(`ZAP API ${url.pathname} returned ${res.statusCode}: ${body}`));
            return;
          }
          try {
            resolve(JSON.parse(body) as T);
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        });
      },
    );
    req.on('error', reject);
  });
}

export function createZapClient(): ZapClient {
  return {
    automation: {
      runPlan: ({ filepath }) => zapRequest('/automation/action/runPlan/', { filePath: filepath }),
      planProgress: ({ planid }) => zapRequest('/automation/view/planProgress/', { planId: planid }),
    },
    core: {
      numberOfMessages: ({ baseurl } = {}) => zapRequest('/core/view/numberOfMessages/', baseurl ? { baseurl } : {}),
    },
  };
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
    const progress = await client.automation.planProgress({ planid: String(planId) });
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

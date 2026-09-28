import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { parse } from 'yaml';

const pathFromHere = (relativePath: string): string => fileURLToPath(new URL(relativePath, import.meta.url));

const [BASELINE_FILE, ...OTHER_FILES] = ['automation-context.yaml', 'automation-passive.yaml', 'automation-active.yaml'];

interface PlanContext {
  name: string;
  urls: string[];
}

async function loadContexts(fileName: string): Promise<unknown> {
  const content = await fs.readFile(pathFromHere(`../../zap/${fileName}`), 'utf8');
  const parsed = parse(content) as { env?: { contexts?: unknown } };
  return parsed.env?.contexts;
}

/**
 * The contexts a plan declares, with `${ENV_VAR}` urls resolved — ZAP does that
 * substitution itself at run time, so the parsed YAML still holds placeholders.
 * checkContextSync keeps all three plans identical, so which is read does not matter.
 */
export async function planContexts(fileName: string = BASELINE_FILE): Promise<PlanContext[]> {
  const contexts = ((await loadContexts(fileName)) ?? []) as PlanContext[];
  return contexts.map(({ name, urls }) => ({
    name,
    urls: urls.map((url) => url.replace(/\$\{(\w+)\}/g, (_, variable: string) => process.env[variable] ?? '')),
  }));
}

// ZAP's Automation Framework has no include/import mechanism for env: blocks
// (its closed set of env: keys — vars, parameters, proxy, contexts, configs —
// treats anything else as a hard error), so all three plans hand-duplicate
// the same contexts: block. Called from prime-context.ts, before it registers
// automation-context.yaml on the daemon, to catch the three drifting apart
// instead of letting ZAP silently register a different site-tree structure
// per plan.
export async function checkContextSync(): Promise<void> {
  const baseline = await loadContexts(BASELINE_FILE);

  const mismatches: string[] = [];
  for (const fileName of OTHER_FILES) {
    if (!isDeepStrictEqual(await loadContexts(fileName), baseline)) {
      mismatches.push(fileName);
    }
  }

  if (mismatches.length > 0) {
    throw new Error(
      `env.contexts in ${mismatches.join(', ')} doesn't match ${BASELINE_FILE} — ZAP has no way to share this block across plans, so all three must be kept identical.`,
    );
  }
}

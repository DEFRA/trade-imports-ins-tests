/**
 * ZAP config for the security profile. All values are optional overrides —
 * nobody needs to set these day-to-day.
 */

// Reuses entrypoint.sh's existing PROFILE convention (already set by CDP)
// rather than a ZAP-specific flag — Playwright's config has no visibility
// into --grep, so this can't be detected from the @active tag directly.
// Two profile values, not one: security (routine, no active scan) and
// security:active (deliberate only outside local).
export const zapEnabled = process.env.PROFILE === 'security' || process.env.PROFILE === 'security:active';

export const zapApiKey = process.env.ZAP_API_KEY || 'local-dev-key';
// Deliberately outside this workspace's two growing port sequences (3xxx
// Node apps, 808x Java services currently at 8085-8089) rather than the
// next free slot after either — a workspace-assigned range only grows, so
// "next free slot" today is "taken by the next new service" eventually.
export const zapPort = process.env.ZAP_PORT || '9095';

// Directory containing the two plan files — differs by environment: local
// ZAP runs in its own container with the plan files bind-mounted here;
// CDP's same-container sidecar reads them straight from the checked-out
// repo. entrypoint.sh overrides this for CDP; local uses the default.
const zapPlanDir = process.env.ZAP_PLAN_DIR || '/zap/plan';

// Single source of truth for which plan is running — the filename below and
// the profile label shown in index.html both derive from this rather than
// checking process.env.PROFILE independently. Fails safe: anything other
// than an explicit, exact 'security:active' is treated as passive, not the
// reverse.
const isActiveProfile = process.env.PROFILE === 'security:active';

export const zapProfile: 'active' | 'passive' = isActiveProfile ? 'active' : 'passive';

function zapAutomationPlanFile(): string {
  return isActiveProfile ? 'automation-active.yaml' : 'automation-passive.yaml';
}

export const zapAutomationPlan = `${zapPlanDir}/${zapAutomationPlanFile()}`;

// Registers contexts (dataDrivenNodes, excludePaths) before any traffic
// exists, so new site-tree nodes are classified correctly as the Playwright
// run creates them — see automation-context.yaml's header for why this
// has to run before, not as part of, zapAutomationPlan above.
export const zapContextPlan = `${zapPlanDir}/automation-context.yaml`;

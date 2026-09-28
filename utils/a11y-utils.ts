import { AxeBuilder } from '@axe-core/playwright';
import type { Result } from 'axe-core';
import { errors, type Page } from '@playwright/test';
import { timeouts } from '@config/timeouts';

export type A11yScanOptions = {
  tags?: string[];
  include?: string | string[];
  exclude?: string | string[];
  disableRules?: string[];
  /**
   * Defaults to false — axe-core-npm opens a temporary blank window as part
   * of analyze() (since v4.3.0) to process results outside the page's
   * context, which is what allows testing content inside cross-origin
   * iframes, but that window-open can hang indefinitely under some
   * conditions: a long-standing, unresolved upstream issue —
   * https://github.com/dequelabs/axe-core-npm/issues/707
   * setLegacyMode() skips that mechanism entirely, at the cost of not
   * testing cross-origin iframes. Set to `true` for scans that hit the hang.
   */
  legacyMode?: boolean;
};

export interface ViolationSummary {
  path: string;
  violations: Result[];
}

const getPathInfo = (url: string): string => {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return 'unknown';
  }
};

export async function scanPage(page: Page, options: A11yScanOptions = {}): Promise<ViolationSummary> {
  const { tags, include, exclude, disableRules, legacyMode = false } = options;

  // Reliable baseline: DOM is parsed and ready.
  await page.waitForLoadState('domcontentloaded');

  // Best effort: allow extra settling, but never block indefinitely.
  try {
    await page.waitForLoadState('networkidle', { timeout: timeouts.medium });
  } catch (error) {
    if (!(error instanceof errors.TimeoutError)) throw error;
  }

  // Without tags axe runs its own default ruleset, which omits target-size — see WCAG_STANDARD in @fixtures/a11y.
  let builder = new AxeBuilder({ page }).setLegacyMode(legacyMode);
  if (tags?.length) builder = builder.withTags(tags);

  if (include !== undefined) builder = builder.include([include].flat());
  if (exclude !== undefined) builder = builder.exclude([exclude].flat());
  if (disableRules?.length) builder = builder.disableRules(disableRules);

  const results = await builder.analyze();

  return {
    path: getPathInfo(page.url()),
    violations: results.violations ?? [],
  };
}

export function formatViolations(violations: Result[]): string {
  return violations
    .map(({ id, impact, description, helpUrl, nodes }) => {
      const severity = (impact ?? 'unknown').toUpperCase();
      const prefix = `  [${severity}] `;
      const indent = ' '.repeat(prefix.length);
      const nodeCount = `${nodes.length} node${nodes.length === 1 ? '' : 's'}`;
      const target = nodes[0]?.target?.join(', ');
      const targetLine = target ? `\n${indent}Target: ${target}` : '';
      return `${prefix}${id}: ${description} (${nodeCount})\n${indent}${helpUrl}${targetLine}`;
    })
    .join('\n\n');
}

export function formatSummaries(results: ViolationSummary[]): string {
  const failed = results.filter(({ violations }) => violations.length > 0);
  if (!failed.length) return '';

  const header = `Accessibility violations found on ${failed.length} page${failed.length === 1 ? '' : 's'}:\n\n`;
  const details = failed.map(({ path, violations }) => `${path}:\n${formatViolations(violations)}`).join('\n\n');

  return header + details;
}

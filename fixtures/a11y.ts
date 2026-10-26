import type { Page } from '@playwright/test';
import { test as base, expect } from '@fixtures';
import { scanPage, formatSummaries, type A11yScanOptions, type ViolationSummary } from '@utils/a11y-utils';

/**
 * Couples the WCAG 2.2 AA name with axe's tags so describe titles and the
 * ruleset can't drift apart. Tags are discrete filters — all five are needed
 * for AA — and axe only automates part of the standard (only 2.5.8 Target
 * Size among the new 2.2 criteria), so a pass isn't full conformance.
 */
export const WCAG_STANDARD = {
  name: 'WCAG 2.2 AA',
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
} as const;

/**
 * Viewports for tests that specifically exercise responsive/reflow
 * behaviour (see e.g. notification-dashboard-viewports.spec.ts). Most a11y
 * tests only need runA11yScan() at the page's current viewport — these are
 * for the handful of tests that deliberately re-scan across breakpoints.
 */
export const scanViewports = {
  /**
   * Re-run the scan at this width after the page's current viewport, since
   * axe only sees what's rendered (e.g. collapsed navigation) and target-size
   * depends on rendered geometry — desktop-only scans miss small-screen issues.
   * 320 CSS px is the WCAG 1.4.10 Reflow width (a 1280px desktop at 400% zoom)
   * and govuk-frontend's smallest breakpoint; height barely matters since axe
   * scans the whole document, so 568 just matches Playwright's iPhone SE
   * descriptor.
   */
  narrowPortrait: { width: 320, height: 568 },

  /**
   * Re-run the scan in landscape too, since axe only sees what's rendered —
   * a portrait-only scan misses layout that breaks on rotation (WCAG 1.3.4
   * Orientation) and the other half of 1.4.10 Reflow (the 256 CSS px
   * "horizontal scroll" height threshold, alongside the narrow viewport's
   * 320 CSS px width one). 568x320 is simply the narrow viewport rotated —
   * Playwright's iPhone SE descriptor in landscape — rather than an
   * arbitrary short height.
   */
  narrowLandscape: { width: 568, height: 320 },
} as const;

// Guards against a race condition: setViewportSize() resolves once the
// browser applies the new metrics, but doesn't wait for any JS that reacts
// to viewport changes (matchMedia listeners, resize handlers) to run — so a
// scan could see stale layout. This is generic browser behaviour: the HTML
// spec guarantees those events fire before the next animation frame, so
// waiting one rAF reliably lets them settle first.
export const waitForViewportSettle = (page: Page): Promise<void> =>
  page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

// Accessibility tests click through several pages and run axe scans on
// each, so they need more headroom than the default per-test timeout.
const A11Y_SCAN_TIMEOUT_MS = 5 * 60 * 1000;

export interface A11yFixtures {
  runA11yScan: (options?: A11yScanOptions) => Promise<void>;
}

export const test = base.extend<A11yFixtures>({
  runA11yScan: async ({ page }, use, testInfo) => {
    // Before test: extend the timeout
    testInfo.setTimeout(A11Y_SCAN_TIMEOUT_MS);

    // Before test: initialise results collection
    const results: ViolationSummary[] = [];

    // During test: scan the page
    await use(async (options) => {
      const summary = await scanPage(page, { ...options, tags: options?.tags ?? [...WCAG_STANDARD.tags] });
      results.push(summary);
    });

    // After test: guard against tests that destructure runA11yScan but never call it
    if (results.length === 0) throw new Error('No accessibility scans were run. Call runA11yScan() at least once.');

    // After test: attach a JSON artefact for each scan that found violations
    for (const { path, violations } of results) {
      if (violations.length > 0) {
        await testInfo.attach(`accessibility-violations: ${path}`, {
          body: JSON.stringify(violations, null, 2),
          contentType: 'application/json',
        });
      }
    }

    // After test: throw a combined error if any scan had violations
    const message = formatSummaries(results);
    if (message) throw new Error(message);
  },
});

export { expect };

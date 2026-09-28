import { test, expect } from '@fixtures';

// Override headless: headed mode uses OS font rendering, producing pixel differences against a headless baseline.
test.use({ headless: true });

test.describe('Origin of import (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toOriginOfImport();
  });

  // Mask the status strip: it now renders from the first request, and the
  // notification reference inside it is minted per run, so an unmasked strip
  // would never match the baseline twice. Masking the whole strip rather than
  // the reference alone keeps the masked box a fixed size — the strip is a
  // full-width block, the reference is not. The strip's own content is covered
  // by tests/animals/e2e/features/reference-strip.spec.ts.
  test('shows expected page appearance on first load', async ({ page, animalsPages }) => {
    await expect(page).toHaveScreenshot('origin-of-import.png', {
      fullPage: true,
      mask: [animalsPages.originOfImport.journeyStrip],
    });
  });
});

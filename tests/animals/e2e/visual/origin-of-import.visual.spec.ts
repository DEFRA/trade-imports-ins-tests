import { test, expect } from '@fixtures';

test.use({ headless: true });

test.describe('Origin of import (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toOriginOfImport();
  });

  test('shows expected page appearance on first load', async ({ page, animalsPages }) => {
    await expect(page).toHaveScreenshot('origin-of-import.png', {
      fullPage: true,
      mask: [animalsPages.originOfImport.journeyStrip],
    });
  });
});

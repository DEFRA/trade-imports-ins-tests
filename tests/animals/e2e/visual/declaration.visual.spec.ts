import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Declaration (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsSeededJourney, animalsJourney }) => {
    await animalsSeededJourney.createDraftNotification();
    await animalsJourney.toDeclarationOfCurrentNotification();
  });

  test('shows the declaration statements, the small confirmation checkbox and no visible legend', async ({ page, animalsPages }) => {
    // Pin the date instead of masking it: a mask is as wide as the text, and the width changes with the day and month.
    await animalsPages.declaration.content.dateValue.evaluate((element) => {
      element.textContent = '1 November 2026';
    });
    await expect(page).toHaveScreenshot('declaration.png', {
      fullPage: true,
    });
  });
});

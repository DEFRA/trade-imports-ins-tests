import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Plants declaration (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ plantsJourney, addressBookApi }) => {
    await plantsJourney.completeNotification(addressBookApi);
    await plantsJourney.toDeclarationFromReview();
  });

  test('shows the declaration statements, the small confirmation checkbox and no visible legend', async ({ page, plantsPages }) => {
    // Pin the date instead of masking it: a mask is as wide as the text, and the width changes with the day and month.
    await plantsPages.declaration.content.dateValue.evaluate((element) => {
      element.textContent = '1 November 2026';
    });
    await expect(page).toHaveScreenshot('plants-declaration.png', {
      fullPage: true,
    });
  });
});

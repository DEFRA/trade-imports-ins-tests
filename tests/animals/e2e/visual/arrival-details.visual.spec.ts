import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Arrival details (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toArrivalDetails();
  });

  test('shows expected page appearance on first load', async ({ page, animalsPages }) => {
    await expect(page).toHaveScreenshot('arrival-details-first-load.png', {
      fullPage: true,
      mask: [animalsPages.arrivalDetails.journeyStrip],
    });
  });
});

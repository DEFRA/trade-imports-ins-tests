import { test, expect } from '@fixtures';
import { sortByValues } from '@domain/constants/sort-by-values';

test.describe('Notification dashboard sort', () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toNotificationDashboard();
  });

  test('default sort option is "Arrival (newest to oldest)"', async ({ animalsPages }) => {
    const selectedOption = animalsPages.dashboard.dropdownSort.locator('option:checked');
    await expect(selectedOption).toHaveText(sortByValues.arrivalNewestToOldest);
  });

  test('sort dropdown contains all four expected options', async ({ animalsPages }) => {
    const options = animalsPages.dashboard.dropdownSort.locator('option');
    await expect(options).toHaveCount(4);
    await expect(options).toHaveText([
      sortByValues.arrivalNewestToOldest,
      sortByValues.arrivalOldestToNewest,
      sortByValues.dateCreatedNewestToOldest,
      sortByValues.dateCreatedOldestToNewest,
    ]);
  });

  for (const value of Object.values(sortByValues)) {
    test(`selecting "${value}" submits and reloads without error`, async ({ pages, animalsPages }) => {
      await animalsPages.dashboard.sortBy(value);
      await expect(pages.page).toHaveURL(/\?sort=/);
      await expect(animalsPages.dashboard.heading).toBeVisible();

      // Sort order correctness is covered by lower-level tests; this spec validates sort option submission only.
    });
  }
});

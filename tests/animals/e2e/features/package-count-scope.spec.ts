import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';

test.describe('Number of packages scope', () => {
  test(
    'commodity details asks for a number of packages only for a commodity that requires one, and for a number of animals for every species',
    { tag: '@duplicated-in-frontend' },
    async ({ animalsJourney, animalsPages }) => {
      await animalsJourney.toConsignmentDetails([commodityLines.cattle, commodityLines.ostrich]);
      const { consignmentDetails } = animalsPages;

      await expect(consignmentDetails.numberOfAnimals).toHaveCount(2);
      await expect(consignmentDetails.numberOfPackages).toHaveCount(1);
      await expect(await consignmentDetails.numberOfAnimalsFor(commodityLines.cattle)).toBeVisible();
      await expect(await consignmentDetails.numberOfAnimalsFor(commodityLines.ostrich)).toBeVisible();
      await expect(await consignmentDetails.numberOfPackagesFor(commodityLines.cattle)).toBeVisible();
    },
  );

  test('the review shows a number of packages row only for the commodity that requires one', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toReviewWithAnimalCounts([
      { species: commodityLines.cattle, animalCount: 1 },
      { species: commodityLines.ostrich, animalCount: 1 },
    ]);
    await expect(animalsPages.notificationView.speciesBlock(commodityLines.cattle).getByRole('term')).toHaveText([
      'Number of animals',
      'Number of packages (when required)',
    ]);
    await expect(animalsPages.notificationView.speciesBlock(commodityLines.ostrich).getByRole('term')).toHaveText(['Number of animals']);
  });
});

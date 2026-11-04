import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';

test.describe('Number of packages scope', () => {
  test(
    'commodity details asks the listed species for a number of animals and a number of packages, and the served unlisted species for a number of animals alone',
    { tag: '@duplicated-in-frontend' },
    async ({ animalsJourney, animalsPages }) => {
      await animalsJourney.toConsignmentDetails([commodityLines.cattle, commodityLines.ostrich]);

      await expect(animalsPages.consignmentDetails.quantityQuestionLabels).toHaveText([
        'Number of animals',
        'Number of packages (when required)',
        'Number of animals',
      ]);
    },
  );

  test("the review's species card ends with the number of packages for the listed species, and holds only its four rows for the served unlisted species", async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toReviewWithAnimalCounts([
      { species: commodityLines.cattle, animalCount: 1 },
      { species: commodityLines.ostrich, animalCount: 1 },
    ]);

    await expect(animalsPages.notificationView.speciesCard(commodityLines.cattle).getByRole('term')).toHaveText([
      'Commodity code',
      'Common name',
      'Species',
      'Number of animals',
      'Number of packages',
    ]);
    await expect(animalsPages.notificationView.speciesCard(commodityLines.ostrich).getByRole('term')).toHaveText([
      'Commodity code',
      'Common name',
      'Species',
      'Number of animals',
    ]);
  });
});

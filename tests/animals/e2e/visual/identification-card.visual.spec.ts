import { MANDATORY_COMMODITY_LINES } from '@domain/animals/constants/journey-commodity-line-answers';
import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Identification card (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([{ species: commodityLines.domesticCat, animalCount: 2 }]);
    const card = animalsPages.animalIdentification.speciesCard(commodityLines.domesticCat);
    await animalsJourney.saveAnimalIdentifiers(card, MANDATORY_COMMODITY_LINES.domesticCat);
    await expect(animalsPages.animalIdentification.enterDetailsCounterHeading(commodityLines.domesticCat, 2, 2)).toBeVisible();
  });

  test('shows the entry form for the second cat above the saved animals table', async ({ page, animalsPages }) => {
    await expect(page).toHaveScreenshot('identification-card.png', {
      fullPage: true,
      mask: [animalsPages.animalIdentification.journeyStrip],
    });
  });
});

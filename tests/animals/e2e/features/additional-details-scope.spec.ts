import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';

test.describe('Additional details scope', { tag: '@duplicated-in-frontend' }, () => {
  test('the unweaned-animals question shows only when a triggering commodity line exists', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();

    const referenceNumber = await animalsJourney.startNotification();

    const certifiedFor = pages.page.getByRole('group', { name: 'What are the animals certified for?' });
    const unweaned = pages.page.getByRole('group', {
      name: 'Does the consignment contain any unweaned animals?',
    });

    const openAdditionalDetails = async (): Promise<void> => {
      await animalsPages.overview.open(referenceNumber);
      await animalsPages.overview.task('Additional details').click();
      await animalsPages.additionalDetails.heading.waitFor();
    };

    await animalsJourney.addCommodityLinesAndAnswerEveryAnimalCount(referenceNumber, [commodityLines.domesticCat], '1');
    await openAdditionalDetails();
    await expect(certifiedFor).toBeVisible();
    await expect(unweaned).toBeHidden();

    await animalsJourney.addCommodityLinesAndAnswerEveryAnimalCount(referenceNumber, [commodityLines.cattle], '1');
    await openAdditionalDetails();
    await expect(certifiedFor).toBeVisible();
    await expect(unweaned).toBeVisible();
  });
});

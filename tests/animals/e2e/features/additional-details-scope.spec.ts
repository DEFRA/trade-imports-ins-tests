import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';

test.describe('Additional details scope', { tag: '@duplicated-in-frontend' }, () => {
  test('the unweaned-animals question shows only when a triggering commodity line exists', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    // Proving scope needs three commodity shapes, and each one walks the hub,
    // selection and consignment pages — roughly 25 loads against a CI runner
    // hosting the whole stack, which does not fit the default budget.
    test.slow();

    const referenceNumber = await animalsJourney.startNotification();

    const certifiedFor = pages.page.getByRole('group', { name: 'What are the animals certified for?' });
    const unweaned = pages.page.getByRole('group', {
      name: 'Does the consignment contain any unweaned animals?',
    });

    // The additional details open from their own task.
    const openAdditionalDetails = async (): Promise<void> => {
      await animalsPages.overview.open(referenceNumber);
      await animalsPages.overview.task('Additional details').click();
      await animalsPages.additionalDetails.heading.waitFor();
    };

    // A non-triggering commodity (cats): certified-for shows, but the
    // notification-level unweaned-animals question is out of scope.
    await animalsJourney.addCommodityLine(referenceNumber, commodityLines.domesticCat);
    await openAdditionalDetails();
    await expect(certifiedFor).toBeVisible();
    await expect(unweaned).toBeHidden();

    // Adding a triggering commodity (cattle) brings the unweaned-animals question
    // into scope across the commodity lines (frame:"anyItem").
    await animalsJourney.addCommodityLine(referenceNumber, commodityLines.cattle);
    await openAdditionalDetails();
    await expect(certifiedFor).toBeVisible();
    await expect(unweaned).toBeVisible();
  });
});

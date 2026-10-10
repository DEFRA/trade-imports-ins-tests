import { test, expect } from '@fixtures';
import type { AnimalsPages } from '@page-objects';

// Each call ADDS a commodity line. The animal count is save-blocking on
// every line, so each box the consignment page is showing — the lines
// added on earlier passes included — is filled before it hands back to the
// hub.
const addCommodity = async (journeyId: string, animalsPages: AnimalsPages, species: string): Promise<void> => {
  await animalsPages.overview.open(journeyId);
  await animalsPages.overview.task('What are you importing?').click();
  await animalsPages.commoditySelection.selectSpecies([species]);
  await animalsPages.commoditySelection.saveAndContinue.click();
  await animalsPages.overview.heading.waitFor();
  await animalsPages.overview.task('Commodity details').click();
  await animalsPages.consignmentDetails.heading.waitFor();
  await animalsPages.consignmentDetails.fillEveryAnimalCount('1');
  await animalsPages.consignmentDetails.saveAndContinue.click();
  await animalsPages.overview.heading.waitFor();
};

// The additional details open from their own task.
const openAdditionalDetails = async (journeyId: string, animalsPages: AnimalsPages): Promise<void> => {
  await animalsPages.overview.open(journeyId);
  await animalsPages.overview.task('Additional details').click();
  await animalsPages.additionalDetails.heading.waitFor();
};

test.describe('Additional details scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the unweaned-animals question shows only when a triggering commodity line exists', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    // Proving scope needs three commodity shapes, and each one walks the hub,
    // selection and consignment pages — roughly 25 loads against a CI runner
    // hosting the whole stack, which does not fit the default budget.
    test.slow();

    const journeyId = await animalsJourney.startNotification();

    const certifiedFor = pages.page.getByRole('group', { name: 'What are the animals certified for?' });
    const unweaned = pages.page.getByRole('group', {
      name: 'Does the consignment contain any unweaned animals?',
    });

    // A non-triggering commodity (cats): certified-for shows, but the
    // notification-level unweaned-animals question is out of scope.
    await addCommodity(journeyId, animalsPages, 'Felis catus');
    await openAdditionalDetails(journeyId, animalsPages);
    await expect(certifiedFor).toBeVisible();
    await expect(unweaned).toBeHidden();

    // Adding a triggering commodity (cattle) brings the unweaned-animals question
    // into scope across the commodity lines (frame:"anyItem").
    await addCommodity(journeyId, animalsPages, 'Bos taurus');
    await openAdditionalDetails(journeyId, animalsPages);
    await expect(certifiedFor).toBeVisible();
    await expect(unweaned).toBeVisible();
  });

  test('a saved unweaned-animals answer is cleared when the commodities change to ones the question is not asked for', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();

    const journeyId = await animalsJourney.startNotification();

    await addCommodity(journeyId, animalsPages, 'Bos taurus');
    await openAdditionalDetails(journeyId, animalsPages);
    await animalsPages.additionalDetails.certifiedFor('Slaughter').check();
    await animalsPages.additionalDetails.containsUnweanedAnimals('Yes').check();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();

    // Change the choice to a cat alone: nothing under 0102 is left, so the
    // unweaned question is no longer asked and its saved answer goes.
    await animalsPages.overview.task('What are you importing?').click();
    await animalsPages.commoditySelection.clearAll.click();
    await animalsPages.commoditySelection.selectSpecies(['Felis catus']);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();

    await animalsPages.overview.reviewAndSubmitButton.click();
    await expect(pages.page.getByText('Includes unweaned animals')).toHaveCount(0);

    // Choosing cattle again asks the question afresh.
    await animalsPages.overview.open(journeyId);
    await animalsPages.overview.task('What are you importing?').click();
    await animalsPages.commoditySelection.selectSpecies(['Bos taurus']);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();
    await openAdditionalDetails(journeyId, animalsPages);
    await expect(animalsPages.additionalDetails.containsUnweanedAnimals('Yes')).not.toBeChecked();
    await expect(animalsPages.additionalDetails.containsUnweanedAnimals('No')).not.toBeChecked();
  });
});

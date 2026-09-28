import { test, expect } from '@fixtures';

test.describe('Additional details scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the unweaned-animals question shows only when a triggering commodity line exists', async ({ journey, pages, animalsPages }) => {
    // Proving scope needs three commodity shapes, and each one walks the hub,
    // selection and consignment pages — roughly 25 loads against a CI runner
    // hosting the whole stack, which does not fit the default budget.
    test.slow();

    const journeyId = await journey.startNotification();

    const certifiedFor = pages.page.getByRole('group', { name: 'What are the animals certified for?' });
    const unweaned = pages.page.getByRole('group', {
      name: 'Does the consignment contain any unweaned animals?',
    });

    // Each call ADDS a commodity line. The animal count is save-blocking on
    // every line, so each box the consignment page is showing — the lines
    // added on earlier passes included — is filled before it hands back to the
    // hub.
    const addCommodity = async (species: string): Promise<void> => {
      await animalsPages.overview.open(journeyId);
      await animalsPages.overview.task('What are you importing?').click();
      await animalsPages.commoditySelection.selectSpecies([species]);
      await animalsPages.commoditySelection.saveAndContinue.click();
      await animalsPages.consignmentDetails.heading.waitFor();
      await animalsPages.consignmentDetails.fillEveryAnimalCount('1');
      await animalsPages.consignmentDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    };

    // A blank reason (enforcedAt=submit) walks straight to the tail page,
    // skipping the internal-market purpose page.
    const openAdditionalDetails = async (): Promise<void> => {
      await animalsPages.overview.open(journeyId);
      await animalsPages.overview.task('Main reason for import').click();
      await animalsPages.importReason.heading.waitFor();
      await animalsPages.importReason.saveAndContinue.click();
      await animalsPages.additionalDetails.heading.waitFor();
    };

    // A non-triggering commodity (cats): certified-for shows, but the
    // notification-level unweaned-animals question is out of scope.
    await addCommodity('Felis catus');
    await openAdditionalDetails();
    await expect(certifiedFor).toBeVisible();
    await expect(unweaned).toBeHidden();

    // Adding a triggering commodity (cattle) brings the unweaned-animals question
    // into scope across the commodity lines (frame:"anyItem").
    await addCommodity('Bos taurus');
    await openAdditionalDetails();
    await expect(certifiedFor).toBeVisible();
    await expect(unweaned).toBeVisible();
  });
});

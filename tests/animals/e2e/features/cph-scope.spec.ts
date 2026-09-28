import { test, expect } from '@fixtures';

test.describe('CPH scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the CPH page and addresses-hub row show only when a CPH-triggering commodity line exists', async ({
    journey,
    pages,
    animalsPages,
  }) => {
    test.slow();

    const journeyId = await journey.startNotification();

    const page = pages.page;
    const cphRow = page.locator('.govuk-summary-list__row', {
      has: page.getByText('County parish holding (CPH) number', { exact: true }),
    });

    // Add one commodity line for the given species, taking the fewest steps.
    // The animal count is save-blocking on every line, so each box the details
    // page is showing — the lines added on earlier passes included — is filled
    // before the page will hand back to the hub.
    const addCommodity = async (species: string): Promise<void> => {
      await animalsPages.overview.open(journeyId);
      await animalsPages.overview.task('What are you importing?').click();
      await animalsPages.commoditySelection.selectSpecies([species]);
      await animalsPages.commoditySelection.saveAndContinue.click();
      await expect(animalsPages.consignmentDetails.heading).toBeVisible();
      await animalsPages.consignmentDetails.fillEveryAnimalCount('1');
      await animalsPages.consignmentDetails.saveAndContinue.click();
      await expect(animalsPages.overview.heading).toBeVisible();
    };

    const openAddresses = async (): Promise<void> => {
      await animalsPages.overview.open(journeyId);
      await animalsPages.overview.task('Roles and addresses').click();
      await expect(animalsPages.addresses.heading).toBeVisible();
    };

    // A non-triggering commodity (cats): CPH is out of scope, so the addresses
    // hub shows no CPH row and Continue returns straight to the hub — no CPH
    // page (the derived gate).
    await addCommodity('Felis catus');
    await openAddresses();
    await expect(cphRow).toBeHidden();
    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();

    // Adding a triggering commodity (cattle) brings CPH into scope across the
    // commodity lines (frame:"anyItem") — the row appears in its empty state.
    await addCommodity('Bos taurus');
    await openAddresses();
    await expect(cphRow).toBeVisible();
    await expect(cphRow).toContainText('Not added yet');

    // Hub-row add flow: the Add link opens the CPH page and saving returns to
    // the addresses hub (not the sequential exit), the row showing the stored
    // slash-stripped value.
    await cphRow.getByRole('link', { name: 'Add' }).click();
    await expect(animalsPages.cphNumber.heading).toBeVisible();
    await animalsPages.cphNumber.fillCphNumber();
    await animalsPages.cphNumber.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(cphRow).toContainText('123456789');

    // Filled state: the row's action reads Change, the page shows the stored
    // value, and the back link returns to the addresses hub.
    await cphRow.getByRole('link', { name: 'Change' }).click();
    await expect(animalsPages.cphNumber.county).toHaveValue('12');
    await expect(animalsPages.cphNumber.parish).toHaveValue('345');
    await expect(animalsPages.cphNumber.holding).toHaveValue('6789');
    await animalsPages.cphNumber.linkBack.click();
    await expect(animalsPages.addresses.heading).toBeVisible();

    // The sequential fallback stays: Continue from the addresses landing still
    // walks to the CPH tail page.
    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.cphNumber.heading).toBeVisible();
  });
});

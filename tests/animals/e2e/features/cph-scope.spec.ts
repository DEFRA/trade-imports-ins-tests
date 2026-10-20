import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';

test.describe('CPH scope', { tag: '@duplicated-in-frontend' }, () => {
  test('the CPH page and addresses-hub row show only when a CPH-triggering commodity line exists', async ({
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();

    const referenceNumber = await animalsJourney.startNotification();

    const { cphRow } = animalsPages.addresses;

    const openAddresses = async (): Promise<void> => {
      await animalsPages.overview.open(referenceNumber);
      await animalsPages.overview.task('Roles and addresses').click();
      await expect(animalsPages.addresses.heading).toBeVisible();
    };

    // A non-triggering commodity (cats): CPH is out of scope, so the addresses
    // hub shows no CPH row and Continue returns straight to the hub — no CPH
    // page (the derived gate).
    await animalsJourney.addCommodityLine(referenceNumber, commodityLines.domesticCat);
    await openAddresses();
    await expect(cphRow).toBeHidden();
    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();

    // Adding a triggering commodity (cattle) brings CPH into scope across the
    // commodity lines (frame:"anyItem") — the row appears in its empty state.
    await animalsJourney.addCommodityLine(referenceNumber, commodityLines.cattle);
    await openAddresses();
    await expect(cphRow).toBeVisible();
    await expect(cphRow).toContainText('Not added yet');

    // Hub-row add flow: the Add link opens the CPH page (reached only from this
    // row) and saving returns to the addresses hub, the row showing the stored
    // slash-stripped value.
    await animalsPages.addresses.addCph.click();
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

    // The CPH page is reached only from its row: Continue from the addresses
    // landing returns to Overview.
    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();
  });
});

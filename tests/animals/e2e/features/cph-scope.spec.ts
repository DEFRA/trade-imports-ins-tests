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

    await animalsJourney.addCommodityLinesAndAnswerEveryAnimalCount(referenceNumber, [commodityLines.domesticCat], '1');
    await openAddresses();
    await expect(cphRow).toBeHidden();
    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();

    await animalsJourney.addCommodityLinesAndAnswerEveryAnimalCount(referenceNumber, [commodityLines.cattle], '1');
    await openAddresses();
    await expect(cphRow).toBeVisible();
    await expect(cphRow).toContainText('Not added yet');

    await animalsPages.addresses.addCph.click();
    await expect(animalsPages.cphNumber.heading).toBeVisible();
    await animalsPages.cphNumber.fillCphNumber();
    await animalsPages.cphNumber.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(cphRow).toContainText('123456789');

    await cphRow.getByRole('link', { name: 'Change' }).click();
    await expect(animalsPages.cphNumber.county).toHaveValue('12');
    await expect(animalsPages.cphNumber.parish).toHaveValue('345');
    await expect(animalsPages.cphNumber.holding).toHaveValue('6789');
    await animalsPages.cphNumber.linkBack.click();
    await expect(animalsPages.addresses.heading).toBeVisible();

    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();
  });
});

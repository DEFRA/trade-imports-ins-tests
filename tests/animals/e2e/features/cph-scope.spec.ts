import { test, expect } from '@fixtures';

test.describe('CPH scope', { tag: '@duplicated-in-frontend' }, () => {
  test('the CPH page and addresses-hub row show only when a CPH-triggering commodity line exists', async ({
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();

    await animalsJourney.startNotification();

    const { cphRow } = animalsPages.addresses;

    await animalsJourney.addCommodityToCurrentNotification('Felis catus');
    await animalsJourney.toRolesAndAddressesOfCurrentNotification();
    await expect(cphRow).toBeHidden();
    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();

    await animalsJourney.addCommodityToCurrentNotification('Bos taurus');
    await animalsJourney.toRolesAndAddressesOfCurrentNotification();
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

import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { CPH_NUMBER_DISPLAY } from '@domain/animals/constants/journey-options';

import { test, expect } from '@fixtures';

test.describe('CPH scope', { tag: '@duplicated-in-frontend' }, () => {
  test('the CPH page and the CPH section of the addresses page show only when a CPH-triggering commodity line exists', async ({
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();

    await animalsJourney.startNotification();

    const { cphSection, cphLinks } = animalsPages.addresses;

    await animalsJourney.addCommodityToCurrentNotificationAndFillEveryAnimalCountToOne(commodityLines.domesticCat);
    await animalsJourney.toConsignmentAddressesOfCurrentNotification();
    await expect(cphSection).toBeHidden();
    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();

    await animalsJourney.addCommodityToCurrentNotificationAndFillEveryAnimalCountToOne(commodityLines.chicken);
    await animalsJourney.toConsignmentAddressesOfCurrentNotification();
    await expect(cphSection).toBeVisible();
    await expect(cphLinks).toHaveText(['Add a CPH number']);
  });

  test('a saved CPH number shows as 12/345/6789 on the addresses page, Change pre-fills county, parish and holding, and Back returns to the addresses page, whose Continue reaches check your answers', async ({
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();

    await animalsJourney.startNotification();

    const { cphLinks, cphNumberText } = animalsPages.addresses;

    // Cattle is a CPH-triggering commodity line; domestic cat is not (chicken is not on the mandatory journey seed).
    await animalsJourney.addCommodityToCurrentNotificationAndFillEveryAnimalCountToOne(commodityLines.cattle);
    await animalsJourney.toConsignmentAddressesOfCurrentNotification();
    await animalsPages.addresses.addCph.click();
    await expect(animalsPages.cphNumber.heading).toBeVisible();
    await animalsPages.cphNumber.fillCphNumber();
    await animalsPages.cphNumber.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(cphNumberText).toHaveText(CPH_NUMBER_DISPLAY);
    await expect(cphLinks).toHaveText([animalsPages.addresses.cphLinkNames.change]);

    await animalsPages.addresses.changeCph.click();
    await expect(animalsPages.cphNumber.county).toHaveValue('12');
    await expect(animalsPages.cphNumber.parish).toHaveValue('345');
    await expect(animalsPages.cphNumber.holding).toHaveValue('6789');
    await animalsPages.cphNumber.linkBack.click();
    await expect(animalsPages.addresses.heading).toBeVisible();

    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();
  });
});

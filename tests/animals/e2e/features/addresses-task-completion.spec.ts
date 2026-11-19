import { CONSIGNMENT_ADDRESSES } from '@domain/animals/constants/consignment-addresses-page';
import { test, expect } from '@fixtures';
import { CAT_ANSWERS } from '@domain/animals/constants/journey-options';

test.describe('Consignment addresses task completion', () => {
  test('the Overview task reads To do with every party answered and no permanent address, and Complete once the permanent address is given', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toConsignmentAddresses(CAT_ANSWERS, () => animalsJourney.answerAnimalIdentification(CAT_ANSWERS));

    await animalsJourney.addFiveParties(CAT_ANSWERS.parties);
    await animalsPages.addresses.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(CONSIGNMENT_ADDRESSES)).toHaveText('To do');

    await animalsJourney.toConsignmentAddressesOfCurrentNotification();
    await animalsJourney.answerPermanentAddresses(CAT_ANSWERS.commodityLines);
    await animalsPages.addresses.saveAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(CONSIGNMENT_ADDRESSES)).toHaveText('Complete');
  });
});

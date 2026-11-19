import { test, expect } from '@fixtures';
import { CAT_ANSWERS } from '@domain/animals/constants/journey-options';

test.describe('Roles and addresses task completion', () => {
  test('the Overview task reads To do with every party answered and no permanent address, and Complete once the permanent address is given', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toRolesAndAddresses(CAT_ANSWERS, () => animalsJourney.answerAnimalIdentification(CAT_ANSWERS));

    await animalsJourney.addFiveParties(CAT_ANSWERS.parties);
    await animalsPages.addresses.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus('Roles and addresses')).toHaveText('To do');

    await animalsJourney.toRolesAndAddressesOfCurrentNotification();
    await animalsJourney.answerPermanentAddresses(CAT_ANSWERS.commodityLines);
    await animalsPages.addresses.saveAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus('Roles and addresses')).toHaveText('Complete');
  });
});

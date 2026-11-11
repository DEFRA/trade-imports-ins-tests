import { MANDATORY_ANSWERS, type NotificationAnswers } from '@domain/animals/constants/journey-options';
import { MANDATORY_COMMODITY_LINES } from '@domain/animals/constants/journey-commodity-line-answers';
import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';

const CAT_ANSWERS: NotificationAnswers = {
  ...MANDATORY_ANSWERS,
  commodityLines: [MANDATORY_COMMODITY_LINES.domesticCat],
};

test.describe('Permanent address page', { tag: '@duplicated-in-frontend' }, () => {
  test('A cat consignment walked from the consignment addresses page through a hand-entered save, back to the consignment addresses page', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toRolesAndAddresses(CAT_ANSWERS, () => animalsJourney.answerAnimalIdentification(CAT_ANSWERS));

    await expect(animalsPages.addresses.permanentAddressSection).toBeVisible();
    await expect(animalsPages.addresses.addPermanentAddress).toBeVisible();

    await animalsPages.addresses.addPermanentAddress.click();
    await expect(animalsPages.permanentAddress.heading).toBeVisible();

    const { permanentAddress: address } = MANDATORY_COMMODITY_LINES.domesticCat;
    const card = animalsPages.permanentAddress.card(commodityLines.domesticCat, 1);
    await expect(card).toBeVisible();
    await animalsPages.permanentAddress.selectNewAddress(card);
    await animalsPages.permanentAddress.fillNewAddress(address, card);
    await animalsPages.permanentAddress.saveAndContinue.click();

    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(animalsPages.addresses.permanentAddressNames).toHaveText(address.nameOrOrganisationName);

    await animalsPages.addresses.changePermanentAddress.click();
    await expect(animalsPages.permanentAddress.heading).toBeVisible();
    const reopenedCard = animalsPages.permanentAddress.card(commodityLines.domesticCat, 1);
    await expect(reopenedCard.getByRole('radio', { name: 'Enter a new address' })).toBeChecked();
    await expect(reopenedCard.getByLabel('Name or organisation name', { exact: true })).toHaveValue(address.nameOrOrganisationName);
  });

  test('A cat consignment submits once its permanent address is answered', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.submitNotification(CAT_ANSWERS);

    await expect(animalsPages.confirmation.heading).toBeVisible();
  });

  test('A cattle consignment offers no permanent address link, and opening the page directly lands on the consignment addresses page', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toRolesAndAddresses();

    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(animalsPages.addresses.permanentAddressSection).toHaveCount(0);

    const referenceNumber = animalsPages.overview.referenceNumberFromUrl();
    await animalsPages.permanentAddress.open(referenceNumber);

    await expect(animalsPages.addresses.heading).toBeVisible();
  });
});

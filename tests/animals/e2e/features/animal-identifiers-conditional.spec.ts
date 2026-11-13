import { MANDATORY_COMMODITY_LINES } from '@domain/animals/constants/journey-commodity-line-answers';
import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';

test.describe('Animal identifiers — conditional identifier surface', { tag: '@duplicated-in-frontend' }, () => {
  test("a domestic cat's unit form asks for microchip, passport and tattoo, and its saved-animals table heads only those identifiers", async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([{ species: commodityLines.domesticCat, animalCount: 2 }]);
    await expect(animalsPages.animalIdentification.enterDetailsCounterHeading(commodityLines.domesticCat, 1, 2)).toBeVisible();

    await expect(animalsPages.animalIdentification.microchip).toBeVisible();
    await expect(animalsPages.animalIdentification.passportNumber).toBeVisible();
    await expect(animalsPages.animalIdentification.tattoo).toBeVisible();
    await expect(animalsPages.animalIdentification.earTag).toBeHidden();
    await expect(animalsPages.animalIdentification.horseName).toBeHidden();

    const catCard = animalsPages.animalIdentification.speciesCard(commodityLines.domesticCat);
    await expect(animalsPages.animalIdentification.cardEntryLabels(catCard)).toHaveText(['Microchip', 'Passport', 'Tattoo']);

    const catLine = MANDATORY_COMMODITY_LINES.domesticCat;
    await animalsJourney.saveAnimalWithPassport(catCard, catLine);

    await expect(animalsPages.animalIdentification.heading).toBeVisible();
    await expect(animalsPages.animalIdentification.cardColumnHeadings(catCard)).toHaveText([
      'Animal',
      'Microchip',
      'Passport',
      'Tattoo',
      'Actions',
    ]);
    const unitRow = animalsPages.animalIdentification.savedAnimalRow(catLine.species, 1);
    await expect(unitRow.getByRole('cell', { name: catLine.passportNumber, exact: true })).toBeVisible();
  });

  test('a commodity with no identifier type of its own asks for identification details then description, refuses an over-long identification details value, and shows both saved values when the notification is reopened, while a cattle line keeps its ear tag, passport and tattoo', async ({
    animalsJourney,
    animalsPages,
  }) => {
    const ostrichLine = MANDATORY_COMMODITY_LINES.ostrich;
    await animalsJourney.toAnimalIdentificationWithCounts([
      { species: commodityLines.cattle, animalCount: 1 },
      { species: ostrichLine.species, animalCount: 1 },
    ]);
    const identification = animalsPages.animalIdentification;
    const referenceNumber = identification.referenceNumberFromUrl();

    await expect(identification.enterDetailsCounterHeading(commodityLines.cattle, 1, 1)).toBeVisible();
    await expect(identification.earTag).toBeVisible();
    await expect(identification.passportNumber).toBeVisible();
    await expect(identification.tattoo).toBeVisible();

    const ostrichCard = identification.speciesCard(ostrichLine.species);
    await expect(identification.cardEntryLabels(ostrichCard)).toHaveText(['Identification details', 'Description']);

    const overLongValue = 'D'.repeat(59);
    await identification.cardIdentificationDetails(ostrichCard).fill(overLongValue);
    await identification.saveAndContinue.click();
    const lengthError = 'Identification details must be 58 characters or less';
    await expect(identification.errorSummaryLink(lengthError)).toBeVisible();
    await identification.cardIdentificationDetails(ostrichCard).fill(ostrichLine.identificationDetails);
    await animalsJourney.saveAnimalWithFallbackDetails(ostrichCard, { description: 'Dark plumage' });
    await identification.open(referenceNumber);

    await expect(identification.cardColumnHeadings(ostrichCard)).toHaveText(['Animal', 'Identification details', 'Description', 'Actions']);
    const ostrichRow = identification.savedAnimalRow(ostrichLine.species, 1);
    await expect(ostrichRow.getByRole('cell', { name: ostrichLine.identificationDetails, exact: true })).toBeVisible();
    await expect(ostrichRow.getByRole('cell', { name: 'Dark plumage', exact: true })).toBeVisible();
    await expect(identification.removeButton(ostrichLine.species, 1)).toBeVisible();
  });

  test('a horse card is asked for a horse name and a donkey card on the same commodity code is not, while both are asked for a microchip and a passport', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([
      { species: commodityLines.horse, animalCount: 2 },
      { species: commodityLines.donkey, animalCount: 2 },
    ]);
    const identification = animalsPages.animalIdentification;
    const horseCard = identification.speciesCard(commodityLines.horse);
    const donkeyCard = identification.speciesCard(commodityLines.donkey);

    await expect(identification.cardMicrochip(horseCard)).toBeVisible();
    await expect(identification.cardPassport(horseCard)).toBeVisible();
    await expect(identification.cardHorseName(horseCard)).toBeVisible();

    await expect(identification.cardMicrochip(donkeyCard)).toBeVisible();
    await expect(identification.cardPassport(donkeyCard)).toBeVisible();
    await expect(identification.cardHorseName(donkeyCard)).toHaveCount(0);

    const donkeyLine = MANDATORY_COMMODITY_LINES.donkey;
    await animalsJourney.saveAnimalWithPassport(donkeyCard, donkeyLine);
    await animalsJourney.saveAnimalWithPassport(horseCard, MANDATORY_COMMODITY_LINES.horse);

    await expect(identification.cardColumnHeadings(donkeyCard)).toHaveText(['Animal', 'Microchip', 'Passport', 'Actions']);
    await expect(identification.cardColumnHeadings(horseCard)).toHaveText(['Animal', 'Microchip', 'Passport', 'Horse name', 'Actions']);

    const savedRow = identification.savedAnimalRow(commodityLines.donkey, 1);
    await expect(savedRow.getByRole('cell', { name: donkeyLine.passportNumber, exact: true })).toBeVisible();
  });

  test('a notification with no commodity line that asks for the identification page is sent to commodity selection', async ({
    animalsJourney,
    animalsPages,
  }) => {
    const referenceNumber = await animalsJourney.startNotification();
    await animalsPages.animalIdentification.open(referenceNumber);

    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await expect(animalsPages.animalIdentification.heading).toHaveCount(0);
  });
});

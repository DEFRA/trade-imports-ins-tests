import { MANDATORY_COMMODITY_LINES } from '@domain/animals/constants/journey-commodity-line-answers';
import { commodityLines, speciesLabel } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';

test.describe('Animal identifiers — conditional identifier surface', { tag: '@duplicated-in-frontend' }, () => {
  test("a domestic cat's unit form asks for microchip, passport and tattoo, with no address field", async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([{ species: commodityLines.domesticCat, animalCount: 2 }]);
    await expect(animalsPages.animalIdentification.enterDetailsCounterHeading(commodityLines.domesticCat, 1, 2)).toBeVisible();

    await expect(animalsPages.animalIdentification.microchip).toBeVisible();
    await expect(animalsPages.animalIdentification.passportNumber).toBeVisible();
    await expect(animalsPages.animalIdentification.tattoo).toBeVisible();
    await expect(animalsPages.animalIdentification.earTag).toBeHidden();
    await expect(animalsPages.animalIdentification.horseName).toBeHidden();
    await expect(pages.page.getByLabel('Identification details')).toHaveCount(0);
    await expect(pages.page.getByLabel('Animal description')).toHaveCount(0);
    await expect(pages.page.getByLabel('Name or organisation name')).toHaveCount(0);
    await expect(pages.page.getByLabel('Country')).toHaveCount(0);

    const catLine = MANDATORY_COMMODITY_LINES.domesticCat;
    const catCard = animalsPages.animalIdentification.speciesCard(commodityLines.domesticCat);
    await animalsJourney.saveAnimalWithPassport(catCard, catLine);

    await expect(animalsPages.animalIdentification.heading).toBeVisible();
    const unitRow = animalsPages.animalIdentification.savedAnimalRow(catLine.species, 1);
    await expect(unitRow.getByRole('cell', { name: catLine.passportNumber, exact: true })).toBeVisible();
  });

  test('a commodity with no identifier type of its own gets no card, while the lines that have one keep theirs', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([
      { species: commodityLines.cattle, animalCount: 1 },
      { species: commodityLines.ostrich, animalCount: 1 },
    ]);

    await expect(animalsPages.animalIdentification.enterDetailsCounterHeading(commodityLines.cattle, 1, 1)).toBeVisible();
    await expect(animalsPages.animalIdentification.earTag).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: `Enter details for ${speciesLabel(commodityLines.ostrich)}` })).toHaveCount(0);
    await expect(pages.page.getByLabel('Identification details')).toHaveCount(0);
    await expect(pages.page.getByLabel('Animal description')).toHaveCount(0);
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

  test('a consignment where no commodity has an identifier type never reaches the identification page', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.toConsignmentDetails([commodityLines.ostrich]);
    await animalsPages.consignmentDetails.numberOfAnimals.fill('2');
    await animalsPages.consignmentDetails.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    const referenceNumber = animalsPages.overview.referenceNumberFromUrl();
    await animalsPages.animalIdentification.open(referenceNumber);
    await expect(animalsPages.additionalDetails.heading).toBeVisible();
    await expect(animalsPages.animalIdentification.heading).toHaveCount(0);
    await expect(pages.page.getByLabel('Identification details')).toHaveCount(0);
    await expect(pages.page.getByLabel('Animal description')).toHaveCount(0);
  });
});

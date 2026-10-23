import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';

test.describe('Animal identifiers — conditional identifier surface', { tag: '@duplicated-in-frontend' }, () => {
  test("a domestic cat's unit form asks for passport, tattoo and a permanent address, and refuses a partial address", async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    const referenceNumber = await animalsJourney.startNotification();
    await animalsJourney.addCommodityLinesAndAnswerEveryAnimalCount(referenceNumber, [commodityLines.domesticCat], '2');
    await animalsPages.overview.task('Identification details').click();
    await expect(animalsPages.animalIdentification.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: `Enter details for ${commodityLines.domesticCat.latinName}` })).toBeVisible();

    await expect(animalsPages.animalIdentification.passportNumber).toBeVisible();
    await expect(pages.page.getByLabel('Tattoo')).toBeVisible();
    await expect(animalsPages.animalIdentification.earTag).toBeHidden();
    await expect(pages.page.getByLabel('Horse name')).toBeHidden();
    await expect(pages.page.getByLabel('Identification details')).toHaveCount(0);
    await expect(pages.page.getByLabel('Animal description')).toHaveCount(0);
    await expect(pages.page.getByLabel('Name or organisation name')).toBeVisible();
    await expect(pages.page.getByLabel('Country')).toHaveCount(0);

    await animalsPages.animalIdentification.passportNumber.fill('UK123456789');
    await pages.page.getByLabel('Name or organisation name').fill('Pet Owner');
    await animalsPages.animalIdentification.saveAndAddAnother.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Enter address line 1' })).toBeVisible();

    await pages.page.getByLabel('Address line 1').fill('1 Farm Lane');
    await pages.page.getByLabel('Town or city').fill('Skipton');
    await pages.page.getByLabel('Postcode or Zip code').fill('BD23 1UD');
    await pages.page.getByLabel('Phone number').fill('+44 1756 555 0192');
    await pages.page.getByLabel('Email address').fill('owner@example.co.uk');
    await animalsPages.animalIdentification.saveAndAddAnother.click();

    await expect(animalsPages.animalIdentification.heading).toBeVisible();
    const unitRow = animalsPages.animalIdentification.savedAnimalRow(commodityLines.domesticCat.latinName, 1);
    await expect(animalsPages.animalIdentification.identifierColumn('Permanent address')).toBeVisible();
    await expect(unitRow.getByRole('cell', { name: 'UK123456789', exact: true })).toBeVisible();
    await expect(unitRow.getByRole('cell', { name: 'Pet Owner', exact: true })).toBeVisible();
  });

  test('a commodity with no identifier type of its own gets no panel, while the lines that have one keep theirs', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    const referenceNumber = await animalsJourney.startNotification();
    await animalsJourney.addCommodityLinesAndAnswerEveryAnimalCount(referenceNumber, [commodityLines.cattle, commodityLines.ostrich], '1');
    await animalsPages.overview.task('Identification details').click();
    await expect(animalsPages.animalIdentification.heading).toBeVisible();

    await expect(animalsPages.animalIdentification.panelHeadings).toHaveText([
      `Enter details for ${commodityLines.cattle.latinName} 1 of 1`,
    ]);
    await expect(animalsPages.animalIdentification.earTag).toBeVisible();
    await expect(pages.page.getByLabel('Identification details')).toHaveCount(0);
    await expect(pages.page.getByLabel('Animal description')).toHaveCount(0);
  });

  test('a consignment where no commodity has an identifier type never reaches the identification page', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    const referenceNumber = await animalsJourney.startNotification();
    await animalsJourney.addCommodityLinesAndAnswerEveryAnimalCount(referenceNumber, [commodityLines.ostrich], '2');

    await animalsPages.animalIdentification.open(referenceNumber);
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.animalIdentification.heading).toHaveCount(0);
    await expect(pages.page.getByLabel('Identification details')).toHaveCount(0);
    await expect(pages.page.getByLabel('Animal description')).toHaveCount(0);
  });
});

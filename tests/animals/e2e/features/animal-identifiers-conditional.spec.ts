import { test, expect } from '@fixtures';

test.describe('Animal identifiers — conditional identifier surface', { tag: '@duplicated-in-frontend' }, () => {
  test('a unit form shows only the identifier types the commodity requires, plus the permanent address for cats and dogs', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([{ species: 'Felis catus', animalCount: 2 }]);
    await expect(pages.page.getByRole('heading', { name: 'Enter details for Felis catus 1 of 2' })).toBeVisible();

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
    const unitRow = animalsPages.animalIdentification.savedAnimalRow('Felis catus', 1);
    await expect(animalsPages.animalIdentification.identifierColumn('Permanent address')).toBeVisible();
    await expect(unitRow.getByRole('cell', { name: 'UK123456789', exact: true })).toBeVisible();
    await expect(unitRow.getByRole('cell', { name: 'Pet Owner', exact: true })).toBeVisible();
  });

  test('a commodity with no identifier type of its own gets no card, while the lines that have one keep theirs', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([
      { species: 'Bos taurus', animalCount: 1 },
      { species: 'Salmo salar', animalCount: 1 },
    ]);

    await expect(pages.page.getByRole('heading', { name: 'Enter details for Bos taurus 1 of 1' })).toBeVisible();
    await expect(animalsPages.animalIdentification.earTag).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: 'Enter details for Salmo salar' })).toHaveCount(0);
    await expect(pages.page.getByLabel('Identification details')).toHaveCount(0);
    await expect(pages.page.getByLabel('Animal description')).toHaveCount(0);
  });

  test('a consignment where no commodity has an identifier type never reaches the identification page', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.toConsignmentDetails(['Salmo salar']);
    await animalsPages.consignmentDetails.numberOfAnimals.fill('2');
    await animalsPages.consignmentDetails.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    const referenceNumber = animalsPages.overview.referenceNumberFromUrl();
    await animalsPages.animalIdentification.open(referenceNumber);
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.animalIdentification.heading).toHaveCount(0);
    await expect(pages.page.getByLabel('Identification details')).toHaveCount(0);
    await expect(pages.page.getByLabel('Animal description')).toHaveCount(0);
  });
});

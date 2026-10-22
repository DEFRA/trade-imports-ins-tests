import { test, expect } from '@fixtures';

const EAR_TAG_ONE_OVER_LIMIT = 'X'.repeat(59);

test.describe('Animal identification page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toAnimalIdentification();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.animalIdentification.heading).toBeVisible();
    await expect(animalsPages.animalIdentification.earTag).toBeVisible();
    await expect(animalsPages.animalIdentification.passportNumber).toBeVisible();
    await expect(animalsPages.animalIdentification.saveAndAddAnother).toHaveCount(0);
    await expect(animalsPages.animalIdentification.saveAndContinue).toBeVisible();
  });

  test('leaves the ear tag empty on load', async ({ animalsPages }) => {
    await expect(animalsPages.animalIdentification.earTag).toHaveValue('');
  });

  test('accepts a valid ear tag', async ({ pages, animalsPages }) => {
    await animalsPages.animalIdentification.earTag.fill('UK123456789012');
    await animalsPages.animalIdentification.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});

test.describe('Animal identification sections and species cards', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([
      { species: 'Bos taurus', animalCount: 2 },
      { species: 'Bison bison', animalCount: 2 },
      { species: 'Felis catus', animalCount: 2 },
    ]);
  });

  test('summarises cattle in one row listing both species with their total, and the cat on its own row', async ({ animalsPages }) => {
    const cowRow = animalsPages.animalIdentification.selectedCommodities.rowFor('Cow');
    await expect(cowRow.getByRole('cell').nth(0)).toHaveText('0102');
    await expect(cowRow.getByRole('cell').nth(2)).toContainText('Bos taurus');
    await expect(cowRow.getByRole('cell').nth(2)).toContainText('Bison bison');
    await expect(cowRow.getByRole('cell').nth(3)).toHaveText('4');

    const catRow = animalsPages.animalIdentification.selectedCommodities.rowFor('Cat');
    await expect(catRow.getByRole('cell').nth(0)).toHaveText('01061900');
    await expect(catRow.getByRole('cell').nth(2)).toHaveText('Felis catus');
    await expect(catRow.getByRole('cell').nth(3)).toHaveText('2');
  });

  test('holds the cattle species cards under the Cow (0102) section and the cat card under its own section, each in the order the species are listed for selection', async ({
    pages,
  }) => {
    await expect(pages.page.locator('main h2, main h3')).toHaveText([
      'Cow (0102)',
      'Bison bison',
      'Bos taurus',
      'Cat (01061900)',
      'Felis catus',
    ]);
  });

  test('saves only the pressed card, shows no error for another species, and leaves that species empty', async ({
    pages,
    animalsPages,
  }) => {
    const bosTaurus = animalsPages.animalIdentification.speciesCard('Bos taurus');
    const bisonBison = animalsPages.animalIdentification.speciesCard('Bison bison');
    await bisonBison.getByLabel('Ear tag', { exact: true }).fill(EAR_TAG_ONE_OVER_LIMIT);
    await bosTaurus.getByLabel('Ear tag', { exact: true }).fill('UK000000000001');
    await bosTaurus.getByRole('button', { name: 'Save and add another' }).click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
    await expect(animalsPages.animalIdentification.savedAnimalRow('Bos taurus', 1)).toBeVisible();
    await expect(bisonBison.getByLabel('Ear tag', { exact: true })).toHaveValue('');
  });

  test('leaves a species of more than one animal unsaved when Save and continue is pressed', async ({ pages, animalsPages }) => {
    await animalsPages.animalIdentification.speciesCard('Felis catus').getByLabel('Passport', { exact: true }).fill('UK123456789');
    await animalsPages.animalIdentification.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Identification details').click();
    const felisCatus = animalsPages.animalIdentification.speciesCard('Felis catus');
    await expect(pages.page.getByRole('heading', { name: 'Enter details for Felis catus 1 of 2' })).toBeVisible();
    await expect(felisCatus.getByLabel('Passport', { exact: true })).toHaveValue('');
  });
});

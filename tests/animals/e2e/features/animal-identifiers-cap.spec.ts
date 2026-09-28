import { test, expect } from '@fixtures';

test.describe('Animal identifiers cap', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the N-of-M counter caps records at the declared count, remove frees a slot, and a count drop is blocked with an error naming the species', async ({
    journey,
    pages,
  }) => {
    test.slow();
    await journey.startNotification();

    // A cattle line with a declared count of 2 (M = 2).
    await pages.overview.task('What are you importing?').click();
    await pages.commoditySelection.selectSpecies(['Bos taurus']);
    await pages.commoditySelection.saveAndContinue.click();
    await expect(pages.consignmentDetails.heading).toBeVisible();
    await pages.consignmentDetails.numberOfAnimals.fill('2');
    await pages.consignmentDetails.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();

    // Counter progression: 1 of 2, then Save and add another moves to 2 of 2
    // with the first record in the card's table.
    await pages.overview.task('Identification details').click();
    await expect(pages.page.getByRole('heading', { name: 'Enter details for Bos taurus 1 of 2' })).toBeVisible();
    await pages.animalIdentification.earTag.fill('UK000000000001');
    await pages.animalIdentification.saveAndAddAnother.click();
    await expect(pages.page.getByRole('heading', { name: 'Enter details for Bos taurus 2 of 2' })).toBeVisible();
    await expect(pages.animalIdentification.identifierColumn('Animal')).toBeVisible();
    await expect(pages.animalIdentification.identifierColumn('Ear tag')).toBeVisible();
    await expect(pages.animalIdentification.identifierColumn('Passport')).toBeVisible();
    await expect(
      pages.animalIdentification.savedAnimalRow('Bos taurus', 1).getByRole('cell', { name: 'UK000000000001', exact: true }),
    ).toBeVisible();

    // At N = M the maximum-reached state replaces the entry form; the saved
    // records stay removable.
    // The second record is the last outstanding animal, so the in-card button
    // finishes the line instead of inviting another.
    await pages.animalIdentification.earTag.fill('UK000000000002');
    await pages.animalIdentification.saveAndFinish.click();
    await expect(
      pages.page.getByText('You have entered details for all 2 Bos taurus animals', {
        exact: false,
      }),
    ).toBeVisible();
    await expect(pages.animalIdentification.earTag).toHaveCount(0);
    await expect(pages.animalIdentification.saveAndAddAnother).toHaveCount(0);

    // Count-drop guard: lowering the count below the record count blocks the
    // details-page save with an error NAMING the species whose summary link
    // goes straight to this species' identifier card — the records are never
    // silently trimmed.
    await pages.animalIdentification.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
    await pages.overview.task('What are you importing?').click();
    await pages.commoditySelection.saveAndContinue.click();
    await expect(pages.consignmentDetails.heading).toBeVisible();
    await pages.consignmentDetails.numberOfAnimals.fill('1');
    await pages.consignmentDetails.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    const dropError = pages.page.getByRole('link', {
      name: 'You have 2 identifier records for Bos taurus but entered 1 animal. Remove identifier records or keep the higher count.',
    });
    await expect(dropError).toBeVisible();
    await dropError.click();
    await expect(pages.animalIdentification.heading).toBeVisible();
    await expect(pages.animalIdentification.savedAnimalRow('Bos taurus', 2)).toBeVisible();

    // Remove frees a slot: the entry form reopens at 2 of 2.
    await pages.animalIdentification.savedAnimalRow('Bos taurus', 2).getByRole('button', { name: 'Remove' }).click();
    await expect(pages.page.getByRole('heading', { name: 'Enter details for Bos taurus 2 of 2' })).toBeVisible();

    // With one record left the drop no longer applies — a count of 1 saves.
    await pages.animalIdentification.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
    await pages.overview.task('What are you importing?').click();
    await pages.commoditySelection.saveAndContinue.click();
    await expect(pages.consignmentDetails.heading).toBeVisible();
    await pages.consignmentDetails.numberOfAnimals.fill('1');
    await pages.consignmentDetails.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
  });
});

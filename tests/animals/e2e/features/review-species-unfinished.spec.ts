import { test, expect } from '@fixtures';

test.describe('Review — species short of a count or an identifier', { tag: '@duplicated-in-frontend' }, () => {
  test('with two identified species and nothing counted, the review names each species short of its number of animals and links to its block', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();

    await animalsPages.overview.task('What are you importing?').click();
    await animalsPages.commoditySelection.selectSpecies(['Bos taurus', 'Felis catus']);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    const journeyId = animalsPages.overview.journeyIdFromUrl();
    await animalsPages.notificationView.open(journeyId);

    const errorSummary = animalsPages.notificationView.errorSummary;
    await expect(errorSummary.getByRole('link', { name: 'Enter the number of animals for bos taurus', exact: true })).toHaveAttribute(
      'href',
      '#species-1',
    );
    await expect(errorSummary.getByRole('link', { name: 'Enter the number of animals for felis catus', exact: true })).toHaveAttribute(
      'href',
      '#species-2',
    );
    await expect(pages.page.getByRole('heading', { level: 4, name: 'Bos Taurus', exact: true })).toHaveAttribute('id', 'species-1');
    await expect(pages.page.getByRole('heading', { level: 4, name: 'Felis Catus', exact: true })).toHaveAttribute('id', 'species-2');
  });

  test('with two identified species counted but none identified, the review names each species short of an identifier and links to its block', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();

    await animalsPages.overview.task('What are you importing?').click();
    await animalsPages.commoditySelection.selectSpecies(['Bos taurus', 'Felis catus']);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Commodity details').click();
    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await animalsPages.consignmentDetails.fillEveryAnimalCount('1');
    await animalsPages.consignmentDetails.fillEveryPackageCount('1');
    await animalsPages.consignmentDetails.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    const journeyId = animalsPages.overview.journeyIdFromUrl();
    await animalsPages.notificationView.open(journeyId);

    const errorSummary = animalsPages.notificationView.errorSummary;
    await expect(
      errorSummary.getByRole('link', { name: 'Enter at least 1 animal identifier for bos taurus', exact: true }),
    ).toHaveAttribute('href', '#species-1');
    await expect(
      errorSummary.getByRole('link', { name: 'Enter at least 1 animal identifier for felis catus', exact: true }),
    ).toHaveAttribute('href', '#species-2');
    await expect(errorSummary.getByRole('link', { name: /^Enter the number of animals for/ })).toHaveCount(0);
    await expect(pages.page.getByRole('heading', { level: 4, name: 'Bos Taurus', exact: true })).toHaveAttribute('id', 'species-1');
  });
});

import { test, expect } from '@fixtures';
import { destinationCountryNames } from '@domain/shared/fixtures/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Destination country list', { tag: ['@integration'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the transhipment destination country list offers the origin countries and their territories, each territory named with its country', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transhipment or onward travel').check();

    await expect(animalsPages.importReason.transhipmentDestinationCountryOptions).toHaveText(destinationCountryNames());
  });

  test('the transit destination country list offers the same places as the transhipment one', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();

    await expect(animalsPages.importReason.transitDestinationCountryOptions).toHaveText(destinationCountryNames());
  });
});

test.describe('Destination country answer', { tag: ['@integration'] }, () => {
  test('a territory chosen as the destination country saves and is shown selected when the page is reopened', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transhipment or onward travel').check();
    const territory = await animalsPages.importReason.transhipmentTerritoryOptions.first().getAttribute('value');
    await animalsPages.importReason.transhipmentDestinationCountry.selectOption(territory);
    const journeyId = animalsPages.importReason.journeyIdFromUrl();
    await animalsPages.importReason.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => url.pathname !== animalsPages.importReason.expectedUrl(journeyId));
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await animalsPages.overview.open(journeyId);
    await animalsPages.overview.task('Main reason for import').click();

    await expect(animalsPages.importReason.transhipmentDestinationCountry).toHaveValue(territory);
  });

  test('a destination country from the country list is still shown selected when the page is reopened', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();
    await animalsPages.importReason.transitPortOfExit.selectOption({ index: 2 });
    await animalsPages.importReason.transitDestinationCountry.selectOption('FR');
    const journeyId = animalsPages.importReason.journeyIdFromUrl();
    await animalsPages.importReason.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => url.pathname !== animalsPages.importReason.expectedUrl(journeyId));
    await animalsPages.overview.open(journeyId);
    await animalsPages.overview.task('Main reason for import').click();

    await expect(animalsPages.importReason.transitDestinationCountry).toHaveValue('FR');
  });
});

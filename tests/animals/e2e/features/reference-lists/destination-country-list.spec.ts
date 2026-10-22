import { test, expect } from '@fixtures';
import { countryCodes } from '@domain/animals/constants/country-codes';
import { countryAndSubdivisionNamesWithCountry } from '@resources/reference-data/reference-data';
import { IMPORT_REASON_TASK, SELECT_ONE_PLACEHOLDER } from '@domain/animals/constants/import-reason-page';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Destination country list', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the transhipment destination country list opens on Select one, then offers the origin countries and their territories, each territory named with its country', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transhipment or onward travel').check();

    await expect(animalsPages.importReason.transhipmentDestinationCountry.select).toHaveValue('');
    await expect(animalsPages.importReason.transhipmentDestinationCountry.options).toHaveText([
      SELECT_ONE_PLACEHOLDER,
      ...countryAndSubdivisionNamesWithCountry(),
    ]);
  });

  test('the transit destination country list opens on Select one, then offers the same places as the transhipment one', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();

    await expect(animalsPages.importReason.transitDestinationCountry.select).toHaveValue('');
    await expect(animalsPages.importReason.transitDestinationCountry.options).toHaveText([
      SELECT_ONE_PLACEHOLDER,
      ...countryAndSubdivisionNamesWithCountry(),
    ]);
  });
});

test.describe('Destination country answer', () => {
  test('a territory chosen as the destination country saves and is shown selected when the page is reopened', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transhipment or onward travel').check();
    const territory = await animalsPages.importReason.transhipmentTerritoryOptions.first().getAttribute('value');
    await animalsPages.importReason.selectTranshipmentDestinationCountry(territory);
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task(IMPORT_REASON_TASK).click();

    await expect(animalsPages.importReason.transhipmentDestinationCountry.select).toHaveValue(territory);
  });

  test('a destination country from the country list is still shown selected when the page is reopened', async ({
    animalsJourney,
    animalsPages,
  }) => {
    const france = countryCodes.eu.france.value;
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();
    await animalsPages.importReason.selectTransitPortOfExitByIndex(1);
    await animalsPages.importReason.selectTransitDestinationCountry(france);
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();

    await expect(animalsPages.importReason.transitDestinationCountry.select).toHaveValue(france);
  });
});

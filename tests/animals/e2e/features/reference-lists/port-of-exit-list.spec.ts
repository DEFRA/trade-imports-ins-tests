import { test, expect } from '@fixtures';
import { countryCodes } from '@domain/animals/constants/country-codes';
import { portLabel, portsOfEntry } from '@domain/shared/fixtures/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Port of exit list', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the transit port of exit list offers every port labelled like the port of entry, in the order reference data serves them', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();

    await expect(animalsPages.importReason.transitPortOfExitValue.locator('option').first()).toHaveText('Select port of exit');
    await expect(animalsPages.importReason.transitPortOfExitOptions).toHaveText(portsOfEntry.map(portLabel));
  });

  test('the temporary admission port of exit list offers the same ports, labelled and ordered the same way', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Temporary admission horses').check();

    await expect(animalsPages.importReason.temporaryAdmissionPortOfExitValue.locator('option').first()).toHaveText('Select port of exit');
    await expect(animalsPages.importReason.temporaryAdmissionPortOfExitOptions).toHaveText(portsOfEntry.map(portLabel));
  });
});

test.describe('Port of exit answer', () => {
  test('a port of exit chosen under transit saves its code and is shown selected when the page is reopened', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();
    const port = await animalsPages.importReason.transitPortOfExitOptions.first().getAttribute('value');
    await animalsPages.importReason.selectTransitPortOfExitByIndex(1);
    await animalsPages.importReason.selectTransitDestinationCountry(countryCodes.eu.france.value);
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Main reason for import').click();

    await expect(animalsPages.importReason.transitPortOfExitValue).toHaveValue(port);
  });
});

import { test, expect } from '@fixtures';
import { countryCodes } from '@domain/animals/constants/country-codes';
import { portLabel, portsOfEntry } from '@resources/reference-data/reference-data';
import { IMPORT_REASON_TASK, SELECT_ONE_PLACEHOLDER } from '@domain/animals/constants/import-reason-page';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Port of exit list', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the transit port of exit list opens on Select one, then offers every port labelled like the port of entry, in the order reference data serves them', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();

    await expect(animalsPages.importReason.transitPortOfExit.select).toHaveValue('');
    await expect(animalsPages.importReason.transitPortOfExit.options).toHaveText([SELECT_ONE_PLACEHOLDER, ...portsOfEntry.map(portLabel)]);
  });

  test('the temporary admission port of exit list opens on Select one, then offers the same ports, labelled and ordered the same way', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Temporary admission horses').check();

    await expect(animalsPages.importReason.temporaryAdmissionPortOfExit.select).toHaveValue('');
    await expect(animalsPages.importReason.temporaryAdmissionPortOfExit.options).toHaveText([
      SELECT_ONE_PLACEHOLDER,
      ...portsOfEntry.map(portLabel),
    ]);
  });
});

test.describe('Port of exit answer', () => {
  test('a port of exit chosen under transit saves its code and is shown selected when the page is reopened', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();
    const port = await animalsPages.importReason.transitPortOfExit.selectableOptions.first().getAttribute('value');
    await animalsPages.importReason.selectTransitPortOfExitByIndex(1);
    await animalsPages.importReason.selectTransitDestinationCountry(countryCodes.eu.france.value);
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();

    await expect(animalsPages.importReason.transitPortOfExit.select).toHaveValue(port);
  });
});

import { test, expect } from '@fixtures';
import { portOfExitLabel, portsInListOrder } from '@domain/shared/fixtures/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Port of exit list', { tag: ['@integration'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the transit port of exit list offers every port as its name and code, airports first, then seaports, then rail ports, each A to Z by name ignoring letter case', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();

    await expect(animalsPages.importReason.transitPortOfExit.locator('option').first()).toHaveText('Select port of exit');
    await expect(animalsPages.importReason.transitPortOfExitOptions).toHaveText(portsInListOrder().map(portOfExitLabel));
  });

  test('the temporary admission port of exit list offers the same ports, labelled and ordered the same way', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Temporary admission horses').check();

    await expect(animalsPages.importReason.temporaryAdmissionPortOfExit.locator('option').first()).toHaveText('Select port of exit');
    await expect(animalsPages.importReason.temporaryAdmissionPortOfExitOptions).toHaveText(portsInListOrder().map(portOfExitLabel));
  });
});

test.describe('Port of exit answer', { tag: ['@integration'] }, () => {
  test('a port of exit chosen under transit saves its code and is shown selected when the page is reopened', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();
    const port = await animalsPages.importReason.transitPortOfExitOptions.first().getAttribute('value');
    await animalsPages.importReason.transitPortOfExit.selectOption(port);
    await animalsPages.importReason.transitDestinationCountry.selectOption('FR');
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Main reason for import').click();

    await expect(animalsPages.importReason.transitPortOfExit).toHaveValue(port);
  });
});

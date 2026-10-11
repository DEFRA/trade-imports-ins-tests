import { test, expect } from '@fixtures';
import { portLabel, portsInListOrder, portsOfEntry } from '@domain/shared/fixtures/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Port of entry list', { tag: ['@integration'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the port of entry list offers every captured port, in the order reference data serves them', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();

    await expect(animalsPages.arrivalDetails.portOptions).toHaveText(portsOfEntry.map(portLabel));
  });

  test('the port of entry list offers every airport, then every seaport, then every rail port, each A to Z by name ignoring letter case', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();

    await expect(animalsPages.arrivalDetails.portOptions).toHaveText(portsInListOrder().map(portLabel));
  });
});

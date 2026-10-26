import { test, expect } from '@fixtures';
import { portLabel, portsOfEntry } from '@resources/reference-data/reference-data';
import { PORT_OF_ENTRY_SELECT_TEXT } from '@domain/animals/constants/point-of-entries';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Port of entry list', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the port of entry list offers every captured port, in the order reference data serves them', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();

    await expect(animalsPages.arrivalDetails.portOfEntry.options).toHaveText([PORT_OF_ENTRY_SELECT_TEXT, ...portsOfEntry.map(portLabel)]);
  });
});

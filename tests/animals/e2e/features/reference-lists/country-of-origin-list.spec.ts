import { test, expect } from '@fixtures';
import { originPageCountryNames } from '@domain/shared/fixtures/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Country of origin list', { tag: ['@integration'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the country of origin list offers the captured origin countries and territories, each territory named with its country', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task('Where is this consignment coming from?').click();

    await expect(animalsPages.originOfImport.countryOptions).toHaveText(originPageCountryNames());
  });
});

test.describe('Country of origin list without JavaScript', { tag: ['@integration'] }, () => {
  test.use({ javaScriptEnabled: false });

  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('without JavaScript the country of origin list names each territory with its country and is sorted by that name', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task('Where is this consignment coming from?').click();

    await expect(animalsPages.originOfImport.countryOptions).toHaveText(originPageCountryNames());
  });
});

import { test, expect } from '@fixtures';
import { countries } from '@domain/shared/fixtures/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Address book country list', { tag: ['@integration'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the Country select offers United Kingdom, then every country reference data serves', async ({ insPages }) => {
    await insPages.addressBookAdd.open();

    await expect(insPages.addressBookAdd.countryOptions).toHaveText(['United Kingdom', ...countries.map(({ name }) => name)]);
  });
});

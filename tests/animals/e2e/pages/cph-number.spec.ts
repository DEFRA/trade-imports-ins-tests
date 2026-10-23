import { test, expect } from '@fixtures';
import { CPH_NUMBER } from '@domain/animals/constants/journey-options';
import type { AnimalsPages } from '@page-objects';

const saveAndExpectCphOnAddresses = async (animalsPages: AnimalsPages, cph: string) => {
  await animalsPages.cphNumber.saveAndContinue.click();
  await expect(animalsPages.addresses.heading).toBeVisible();
  await expect(animalsPages.addresses.cphNumberText).toHaveText(cph);
};

test.describe('CPH number page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toCphNumber();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.cphNumber.heading).toBeVisible();
    await expect(animalsPages.cphNumber.county).toBeVisible();
    await expect(animalsPages.cphNumber.parish).toBeVisible();
    await expect(animalsPages.cphNumber.holding).toBeVisible();
    await expect(animalsPages.cphNumber.saveAndContinue).toBeVisible();
  });

  test('leaves the CPH number empty on load', async ({ animalsPages }) => {
    await expect(animalsPages.cphNumber.county).toHaveValue('');
    await expect(animalsPages.cphNumber.parish).toHaveValue('');
    await expect(animalsPages.cphNumber.holding).toHaveValue('');
  });

  test('saves a valid CPH number and shows it on Consignment addresses', async ({ animalsPages }) => {
    await animalsPages.cphNumber.fillCphNumber();

    await saveAndExpectCphOnAddresses(animalsPages, CPH_NUMBER);
  });

  test('asks for the whole CPH number once in the error summary when submitted empty', async ({ animalsPages }) => {
    await animalsPages.cphNumber.saveAndContinue.click();

    await expect(animalsPages.cphNumber.errorSummaryLinks).toHaveText(['Enter a CPH number']);
  });

  test('keeps all nine digits typed straight through the county box and saves them', async ({ animalsPages }) => {
    const { county } = animalsPages.cphNumber;

    await county.click();
    await county.pressSequentially('123456789');
    await expect(county).toHaveValue('123456789');
    await expect(county).toBeFocused();

    await saveAndExpectCphOnAddresses(animalsPages, CPH_NUMBER);
  });
});

test.describe('CPH number page without JavaScript', { tag: '@duplicated-in-frontend' }, () => {
  test.use({ javaScriptEnabled: false });

  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toCphNumber();
  });

  test('saves a whole number with slashes inserted into the county box as nine digits', async ({ animalsPages }) => {
    await animalsPages.cphNumber.county.fill('12/345/6789');

    await saveAndExpectCphOnAddresses(animalsPages, CPH_NUMBER);
  });
});

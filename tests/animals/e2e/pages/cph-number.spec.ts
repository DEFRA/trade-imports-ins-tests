import { test, expect } from '@fixtures';

test.describe('CPH number page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
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

  test('accepts a valid CPH number', async ({ pages, animalsPages }) => {
    await animalsPages.cphNumber.fillCphNumber();
    await animalsPages.cphNumber.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('shows an error summary when submitted empty', async ({ pages, animalsPages }) => {
    test.slow();

    await animalsPages.cphNumber.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});

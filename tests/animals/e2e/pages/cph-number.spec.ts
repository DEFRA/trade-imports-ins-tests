import { test, expect } from '@fixtures';

test.describe('CPH number page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toCphNumber();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.cphNumber.heading).toBeVisible();
    await expect(pages.cphNumber.county).toBeVisible();
    await expect(pages.cphNumber.parish).toBeVisible();
    await expect(pages.cphNumber.holding).toBeVisible();
    await expect(pages.cphNumber.saveAndContinue).toBeVisible();
  });

  test('leaves the CPH number empty on load', async ({ pages }) => {
    await expect(pages.cphNumber.county).toHaveValue('');
    await expect(pages.cphNumber.parish).toHaveValue('');
    await expect(pages.cphNumber.holding).toHaveValue('');
  });

  test('accepts a valid CPH number', async ({ pages }) => {
    await pages.cphNumber.fillCphNumber();
    await pages.cphNumber.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('shows an error summary when submitted empty', async ({ pages }) => {
    test.slow();

    await pages.cphNumber.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});

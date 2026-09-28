import { test, expect } from '@fixtures';

test.describe('Import reason page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toImportReason();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.importReason.heading).toBeVisible();
    await expect(pages.importReason.questionGroup).toBeVisible();
    // The question is the radio group's legend, not the page heading — if it is
    // ever promoted back to an h1 this fails, mirroring the frontend fit spec.
    await expect(pages.page.getByRole('heading', { name: 'What is the main reason for importing the animals?' })).toHaveCount(0);
    await expect(pages.importReason.reason('Internal market')).toBeVisible();
    await expect(pages.importReason.saveAndContinue).toBeVisible();
  });

  test('leaves the import reason unchecked on load', async ({ pages }) => {
    await expect(pages.importReason.reason('Internal market')).not.toBeChecked();
  });

  // Re-entry opens no reveal, so it is the reason that submits with nothing
  // else owed — the same choice change-from-cya.spec.ts makes.
  test('accepts a valid import reason', async ({ pages }) => {
    await pages.importReason.reason('Re-entry').check();
    await pages.importReason.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('reveals the import purpose under the internal market reason and accepts it', async ({ pages }) => {
    await pages.importReason.reason('Internal market').check();

    await expect(pages.importReason.purpose('Breeding')).toBeVisible();
    await expect(pages.importReason.purpose('Breeding')).not.toBeChecked();

    await pages.importReason.purpose('Breeding').check();
    await pages.importReason.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('refuses an unanswered purpose under the internal market reason', async ({ pages }) => {
    await pages.importReason.reason('Internal market').check();
    await pages.importReason.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Select a purpose in the internal market' })).toBeVisible();
    await expect(pages.importReason.heading).toBeVisible();
  });
});

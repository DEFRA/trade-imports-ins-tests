import { test, expect } from '@fixtures';

test.describe('Reason and purpose scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('purpose is owed only for the internal market and is wiped when the reason changes', async ({ journey, pages }) => {
    await journey.startNotification();
    await journey.unlockSections();

    const reasonRow = pages.page.locator('.govuk-task-list__item', { hasText: 'Main reason for import' });

    // Internal market: the purpose reveals under the reason, so reason + purpose
    // go in on one submit and the tail page completes the row.
    await pages.overview.task('Main reason for import').click();
    await pages.importReason.reason('Internal market').check();
    await pages.importReason.purpose('Breeding').check();
    await pages.importReason.saveAndContinue.click();
    await expect(pages.additionalDetails.heading).toBeVisible();
    await pages.additionalDetails.certifiedFor('Slaughter').check();
    await pages.additionalDetails.saveAndContinue.click();
    await expect(reasonRow).toContainText('Complete');

    // Transit: the purpose is no longer owed, but the reason-gated exit details
    // (port of exit + destination country) come into scope and reveal under the
    // reason, so the walk answers them on the same submit.
    await pages.overview.task('Main reason for import').click();
    await pages.importReason.reason('Transit').check();
    await pages.importReason.transitPortOfExit.selectOption({ index: 2 });
    await pages.importReason.transitDestinationCountry.selectOption('FR');
    await pages.importReason.saveAndContinue.click();
    await expect(pages.additionalDetails.heading).toBeVisible();
    await pages.additionalDetails.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
    await expect(reasonRow).toContainText('Complete');

    // Back to the internal market: leaving scope wiped the saved purpose, so no
    // purpose radio is pre-selected and the task is owed again. The assertion is
    // scoped to the purpose radios — the reason radio is checked on this page.
    await pages.overview.task('Main reason for import').click();
    await pages.importReason.reason('Internal market').check();
    await expect(pages.page.locator('input[name="purposeInInternalMarket"]:checked')).toHaveCount(0);

    // The purpose is owed again, and it is now enforced where it is asked: a
    // blank save returns the page with the error rather than walking on.
    await pages.importReason.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Select a purpose in the internal market' })).toBeVisible();
    await expect(pages.additionalDetails.heading).toHaveCount(0);

    // Answering the newly owed purpose completes the row again.
    await pages.importReason.reason('Internal market').check();
    await pages.importReason.purpose('Breeding').check();
    await pages.importReason.saveAndContinue.click();
    await expect(pages.additionalDetails.heading).toBeVisible();
    await pages.additionalDetails.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
    await expect(reasonRow).toContainText('Complete');
  });
});

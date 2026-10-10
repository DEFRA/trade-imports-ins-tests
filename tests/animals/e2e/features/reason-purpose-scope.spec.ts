import { test, expect } from '@fixtures';

test.describe('Reason and purpose scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('purpose is owed only for the internal market and is wiped when the reason changes', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    const reasonRow = pages.page.locator('.govuk-task-list__item', { hasText: 'Main reason for import' });

    // Internal market: the purpose reveals under the reason, so reason + purpose
    // go in on one submit and the additional details, opened from their own
    // task, complete the row.
    await animalsPages.overview.task('Main reason for import').click();
    await animalsPages.importReason.reason('Internal market').check();
    await animalsPages.importReason.purpose('Breeding').check();
    await animalsPages.importReason.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Additional details').click();
    await expect(animalsPages.additionalDetails.heading).toBeVisible();
    await animalsPages.additionalDetails.certifiedFor('Slaughter').check();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await expect(reasonRow).toContainText('Complete');

    // Transit: the purpose is no longer owed, but the reason-gated exit details
    // (port of exit + destination country) come into scope and reveal under the
    // reason, so the walk answers them on the same submit.
    await animalsPages.overview.task('Main reason for import').click();
    await animalsPages.importReason.reason('Transit').check();
    await animalsPages.importReason.transitPortOfExit.selectOption({ index: 1 });
    await animalsPages.importReason.transitDestinationCountry.selectOption('FR');
    await animalsPages.importReason.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Additional details').click();
    await expect(animalsPages.additionalDetails.heading).toBeVisible();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(reasonRow).toContainText('Complete');

    // Back to the internal market: leaving scope wiped the saved purpose, so no
    // purpose radio is pre-selected and the task is owed again. The assertion is
    // scoped to the purpose radios — the reason radio is checked on this page.
    await animalsPages.overview.task('Main reason for import').click();
    await animalsPages.importReason.reason('Internal market').check();
    await expect(pages.page.locator('input[name="purposeInInternalMarket"]:checked')).toHaveCount(0);

    // The purpose is owed again, and it is now enforced where it is asked: a
    // blank save returns the page with the error rather than walking on.
    await animalsPages.importReason.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Select a purpose in the internal market' })).toBeVisible();
    await expect(animalsPages.additionalDetails.heading).toHaveCount(0);

    // Answering the newly owed purpose completes the row again.
    await animalsPages.importReason.reason('Internal market').check();
    await animalsPages.importReason.purpose('Breeding').check();
    await animalsPages.importReason.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Additional details').click();
    await expect(animalsPages.additionalDetails.heading).toBeVisible();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(reasonRow).toContainText('Complete');
  });
});

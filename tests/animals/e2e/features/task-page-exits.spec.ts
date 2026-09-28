import { test, expect } from '@fixtures';

test.describe('Task-page exits', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('Cancel and return to overview discards typed input; Save and return to overview commits and lands on the hub', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    // Origin is the journey entry, so it is already answered by the time the
    // hub is reachable; the internal reference is the field left untouched.
    await animalsJourney.startNotification();

    // Cancel leg: type an internal reference, cancel — nothing is written.
    await animalsPages.overview.task('Where is this consignment coming from?').click();
    await animalsPages.originOfImport.internalReference.fill('DiscardedRef');
    await pages.page.getByRole('link', { name: 'Cancel and return to overview' }).click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Where is this consignment coming from?').click();
    // Nothing was committed, so the server-rendered input is still empty.
    await expect(animalsPages.originOfImport.internalReference).toHaveValue('');

    // Save-and-return leg: the named secondary submit commits the page and
    // redirects to the hub instead of the next flow target.
    await animalsPages.originOfImport.internalReference.fill('CommittedRef');
    await pages.page.getByRole('button', { name: 'Save and return to overview' }).click();
    await expect(animalsPages.overview.heading).toBeVisible();

    // The committed reference is there on re-entry.
    await animalsPages.overview.task('Where is this consignment coming from?').click();
    await expect(animalsPages.originOfImport.internalReference).toHaveValue('CommittedRef');
  });
});

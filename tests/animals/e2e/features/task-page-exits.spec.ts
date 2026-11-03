import { test, expect } from '@fixtures';

const ARRIVAL_DETAILS_TASK = 'Arrival details';

test.describe('Task-page exits', { tag: '@duplicated-in-frontend' }, () => {
  test('Cancel and return to overview discards typed input; Save and return to overview commits and lands on the hub', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();

    await animalsPages.arrivalDetails.transportDocumentReference.fill('DiscardedRef');
    await animalsPages.arrivalDetails.cancelAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task(ARRIVAL_DETAILS_TASK).click();
    await expect(animalsPages.arrivalDetails.transportDocumentReference).toHaveValue('');

    await animalsPages.arrivalDetails.transportDocumentReference.fill('CommittedRef');
    await animalsPages.arrivalDetails.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task(ARRIVAL_DETAILS_TASK).click();
    await expect(animalsPages.arrivalDetails.transportDocumentReference).toHaveValue('CommittedRef');
  });
});

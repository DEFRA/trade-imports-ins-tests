import { test, expect } from '@fixtures';
import { meansOfTransport } from '@domain/animals/constants/means-of-transport';

test.describe('Task-page exits', { tag: '@duplicated-in-frontend' }, () => {
  test('Cancel and return to overview discards typed input; Save and return to overview commits and lands on the hub', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();

    await animalsPages.arrivalDetails.transportDocumentReference.fill('DiscardedRef');
    await animalsPages.arrivalDetails.cancelAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Arrival details').click();
    await expect(animalsPages.arrivalDetails.transportDocumentReference).toHaveValue('');

    await animalsPages.arrivalDetails.chooseMeansOfTransport(meansOfTransport.roadVehicle.display);
    await animalsPages.arrivalDetails.transportDocumentReference.fill('CommittedRef');
    await animalsPages.arrivalDetails.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Arrival details').click();
    await expect(animalsPages.arrivalDetails.transportDocumentReference).toHaveValue('CommittedRef');
  });
});

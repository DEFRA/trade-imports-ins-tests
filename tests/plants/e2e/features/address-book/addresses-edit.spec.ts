import { test, expect } from '@fixtures';
import { PLANTS_FOR_PLANTING } from '@flows/plants/journey';

test.describe('Copied addresses are edited on the notification', () => {
  test('a copied address offers both Change and Edit details on the picker and the review', async ({
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    // Plants for planting, so the consignor is asked as well as the destination and contact.
    const { reference, address } = await plantsJourney.completeNotification(addressBookApi, {
      type: PLANTS_FOR_PLANTING,
      days: -1,
    });

    await plantsPages.consignorSelect.open(reference);
    await plantsPages.consignorSelect.searchFor(address.name);
    await expect(plantsPages.consignorSelect.address(address.name)).toBeVisible();
    await expect(plantsPages.consignorSelect.editCurrentAddress).toBeVisible();

    await plantsPages.placeOfDestination.open(reference);
    await plantsPages.placeOfDestination.searchFor(address.name);
    await expect(plantsPages.placeOfDestination.address(address.name)).toBeVisible();
    await expect(plantsPages.placeOfDestination.editCurrentAddress).toBeVisible();

    await plantsPages.consignmentContactSelect.open(reference);
    await plantsPages.consignmentContactSelect.searchFor(address.name);
    await expect(plantsPages.consignmentContactSelect.address(address.name)).toBeVisible();
    await expect(plantsPages.consignmentContactSelect.editCurrentAddress).toBeVisible();

    await plantsPages.notificationView.open(reference);
    await expect(plantsPages.notificationView.changeAddress('Consignor')).toBeVisible();
    await expect(plantsPages.notificationView.editDetails('Consignor')).toBeVisible();
    await expect(plantsPages.notificationView.changeAddress('Where is the consignment now?')).toBeVisible();
    await expect(plantsPages.notificationView.editDetails('Where is the consignment now?')).toBeVisible();
    await expect(plantsPages.notificationView.changeAddress('Contact')).toBeVisible();
    await expect(plantsPages.notificationView.editDetails('Contact')).toBeVisible();
  });
});

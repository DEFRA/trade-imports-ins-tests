import { test, expect } from '@fixtures';

test.describe('Addresses picker', { tag: '@address-book' }, () => {
  test('reopening the picker names the record the address was chosen from, and names nothing once the address is edited on the notification', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await plantsJourney.completeNotification(addressBookApi);
    const editedName = `Edited Destination ${address.name}`;

    // The notification keeps which record it was chosen from, only to tick it again here.
    await plantsPages.placeOfDestination.open(reference);
    await expect(plantsPages.placeOfDestination.selectedAddress(address.name)).toBeVisible();
    await expect(plantsPages.placeOfDestination.currentAddress).toContainText(address.name);

    await plantsPages.placeOfDestination.editCurrentAddress.click();
    await plantsPages.placeOfDestinationEdit.fill({ name: editedName });
    await plantsPages.placeOfDestinationEdit.saveChanges.click();

    // Once edited, the copy is no longer the book's record, so there is nothing to tick.
    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrl(reference));
    await expect(plantsPages.placeOfDestination.currentAddress).toContainText(editedName);
    await expect(plantsPages.placeOfDestination.selectedAddressInset).toHaveCount(0);

    await plantsPages.placeOfDestination.open(reference);
    await expect(plantsPages.placeOfDestination.selectedAddressInset).toHaveCount(0);
  });
});

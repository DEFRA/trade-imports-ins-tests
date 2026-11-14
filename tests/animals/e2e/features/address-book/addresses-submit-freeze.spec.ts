import { test, expect } from '@fixtures';
import { heldAsPlaceOfOrigin } from '@domain/shared/constants/address-types';

test.describe('Submitted addresses keep their copy', () => {
  test('renaming the book after submit changes neither the submitted view nor the amendment, and cancelling the amendment keeps the copy', async ({
    animalsSeededJourney,
    pages,
    animalsPages,
    addressBookApi,
    animalsNotificationActions,
  }) => {
    test.slow();

    const stamp = Date.now();
    const originalName = `Frozen Origin ${stamp}`;
    const renamed = `Renamed Origin ${stamp}`;
    const address = await addressBookApi.createAddress({
      ...heldAsPlaceOfOrigin,
      name: originalName,
      addressLine1: '8 Freeze Street',
      townOrCity: 'Carlisle',
      postcode: 'CA1 4DD',
      countryCode: 'GB',
      phone: '01228 555 0106',
      email: 'freeze@example.co.uk',
    });

    const referenceNumber = await animalsSeededJourney.createSubmittedWithPlaceOfOriginChosenInUi(animalsPages, originalName);
    const originRow = animalsPages.notificationView.partyRow('Addresses', 'Place of origin');

    await addressBookApi.updateAddress(address.id, {
      ...heldAsPlaceOfOrigin,
      name: renamed,
      addressLine1: '8 Freeze Street',
      townOrCity: 'Penrith',
      postcode: 'CA11 8DD',
      countryCode: 'GB',
      phone: '01228 555 0106',
      email: 'freeze@example.co.uk',
    });

    await animalsNotificationActions.toNotificationView(referenceNumber);
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(originRow).not.toContainText(renamed);
    await expect(originRow).not.toContainText('Penrith');

    await animalsNotificationActions.amendNotification(referenceNumber);
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(originRow).not.toContainText(renamed);
    await expect(originRow).not.toContainText('Penrith');

    await animalsPages.notificationView.btnCancelAmend.click();
    await animalsPages.notificationCancelAmend.confirm.click();
    await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(originRow).not.toContainText(renamed);
  });

  test('deleting the book record after submit changes neither the submitted view nor the amendment, and shows no error', async ({
    animalsSeededJourney,
    animalsPages,
    addressBookApi,
    animalsNotificationActions,
  }) => {
    test.slow();

    const stamp = Date.now();
    const originalName = `Frozen Then Deleted ${stamp}`;
    const address = await addressBookApi.createAddress({
      ...heldAsPlaceOfOrigin,
      name: originalName,
      addressLine1: '9 Delete Street',
      townOrCity: 'Carlisle',
      postcode: 'CA1 4DE',
      countryCode: 'GB',
      phone: '01228 555 0107',
      email: 'delete-freeze@example.co.uk',
    });

    const referenceNumber = await animalsSeededJourney.createSubmittedWithPlaceOfOriginChosenInUi(animalsPages, originalName);
    const originRow = animalsPages.notificationView.partyRow('Addresses', 'Place of origin');

    await addressBookApi.deleteAddress(address.id);

    await animalsNotificationActions.toNotificationView(referenceNumber);
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);

    await animalsNotificationActions.amendNotification(referenceNumber);
    await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);
  });
});

import { test, expect } from '@fixtures';

test.describe('Submitted addresses keep their copy', { tag: ['@integration'] }, () => {
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
      name: originalName,
      addressLine1: '8 Freeze Street',
      townOrCity: 'Carlisle',
      postcode: 'CA1 4DD',
      countryCode: 'GB',
      phone: '01228 555 0106',
      email: 'freeze@example.co.uk',
    });

    const referenceNumber = await animalsSeededJourney.createDraftNotification('readyToSubmit');
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);
    await animalsPages.notificationView.changeLink('Change roles and addresses').click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await animalsPages.addresses.changeParty('Place of origin').click();
    await animalsPages.placeOfOriginSelection.select(originalName);
    await animalsPages.placeOfOriginSelection.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    const originRow = animalsPages.notificationView.partyRow('Roles and addresses', 'Place of origin');
    await expect(originRow).toContainText(originalName);

    await animalsPages.notificationView.continueButton.click();
    await expect(animalsPages.declaration.heading).toBeVisible();
    await animalsPages.declaration.confirmation.check();
    await animalsPages.declaration.continueButton.click();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();

    await addressBookApi.updateAddress(address.id, {
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
    await animalsPages.overview.reviewAndSubmitButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Amending');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(originRow).not.toContainText(renamed);
    await expect(originRow).not.toContainText('Penrith');

    await animalsPages.notificationView.cancelAmendment.click();
    await animalsPages.notificationCancelAmend.confirm.click();
    await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(originRow).not.toContainText(renamed);
  });

  test('deleting the book record after submit changes neither the submitted view nor the amendment, and shows no error', async ({
    animalsSeededJourney,
    pages,
    animalsPages,
    addressBookApi,
    animalsNotificationActions,
  }) => {
    test.slow();

    const stamp = Date.now();
    const originalName = `Frozen Then Deleted ${stamp}`;
    const address = await addressBookApi.createAddress({
      name: originalName,
      addressLine1: '9 Delete Street',
      townOrCity: 'Carlisle',
      postcode: 'CA1 4DE',
      countryCode: 'GB',
      phone: '01228 555 0107',
      email: 'delete-freeze@example.co.uk',
    });

    const referenceNumber = await animalsSeededJourney.createDraftNotification('readyToSubmit');
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);
    await animalsPages.notificationView.changeLink('Change roles and addresses').click();
    await animalsPages.addresses.changeParty('Place of origin').click();
    await animalsPages.placeOfOriginSelection.select(originalName);
    await animalsPages.placeOfOriginSelection.saveAndContinue.click();
    await animalsPages.addresses.continueButton.click();

    const originRow = animalsPages.notificationView.partyRow('Roles and addresses', 'Place of origin');
    await expect(originRow).toContainText(originalName);

    await animalsPages.notificationView.continueButton.click();
    await animalsPages.declaration.confirmation.check();
    await animalsPages.declaration.continueButton.click();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();

    await addressBookApi.deleteAddress(address.id);

    await animalsNotificationActions.toNotificationView(referenceNumber);
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);

    await animalsNotificationActions.amendNotification(referenceNumber);
    await animalsPages.overview.reviewAndSubmitButton.click();
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Amending');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);
  });
});

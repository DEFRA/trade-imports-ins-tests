import { test, expect } from '@fixtures';

test.describe('Submitted addresses are frozen', { tag: ['@integration'] }, () => {
  test('renaming the book after submit does not change the submitted view, then shows live on amend', async ({
    seededJourney,
    pages,
    addressBookApi,
    notificationActions,
  }) => {
    test.slow();

    const stamp = Date.now();
    const originalName = `Frozen Origin ${stamp}`;
    const renamed = `Live Origin ${stamp}`;
    const address = await addressBookApi.createAddress({
      name: originalName,
      addressLine1: '8 Freeze Street',
      townOrCity: 'Carlisle',
      postcode: 'CA1 4DD',
      countryCode: 'United Kingdom',
      phone: '01228 555 0106',
      email: 'freeze@example.co.uk',
    });

    const referenceNumber = await seededJourney.createDraftNotification('readyToSubmit');
    await seededJourney.resumeInUi(referenceNumber, pages.notificationView);
    await pages.notificationView.changeLink('Change roles and addresses').click();
    await expect(pages.addresses.heading).toBeVisible();
    await pages.addresses.changeParty('Place of origin').click();
    await pages.placeOfOriginSelection.select(originalName);
    await pages.placeOfOriginSelection.saveAndContinue.click();
    await expect(pages.addresses.heading).toBeVisible();
    await pages.addresses.continueButton.click();
    await expect(pages.notificationView.heading).toBeVisible();

    const originRow = pages.notificationView.partyRow('Roles and addresses', 'Place of origin');
    await expect(originRow).toContainText(originalName);

    await pages.notificationView.continueButton.click();
    await expect(pages.declaration.heading).toBeVisible();
    await pages.declaration.confirmation.check();
    await pages.declaration.continueButton.click();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();

    await addressBookApi.updateAddress(address.id, {
      name: renamed,
      addressLine1: '8 Freeze Street',
      townOrCity: 'Penrith',
      postcode: 'CA11 8DD',
      countryCode: 'United Kingdom',
      phone: '01228 555 0106',
      email: 'freeze@example.co.uk',
    });

    await notificationActions.toNotificationView(referenceNumber);
    await expect(pages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(originRow).not.toContainText(renamed);
    await expect(originRow).not.toContainText('Penrith');

    await notificationActions.amendNotification(referenceNumber);
    await pages.overview.reviewAndSubmitButton.click();
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.journeyStrip).toContainText('Amending');
    await expect(originRow).toContainText(renamed);
    await expect(originRow).toContainText('Penrith');
    await expect(originRow).not.toContainText(originalName);

    await pages.notificationView.cancelAmendment.click();
    await pages.notificationCancelAmend.confirm.click();
    await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
    await expect(pages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).not.toContainText(renamed);
  });

  test('deleting the book record after submit does not change the submitted view or error', async ({
    seededJourney,
    pages,
    addressBookApi,
    notificationActions,
  }) => {
    test.slow();

    const stamp = Date.now();
    const originalName = `Frozen Then Deleted ${stamp}`;
    const address = await addressBookApi.createAddress({
      name: originalName,
      addressLine1: '9 Delete Street',
      townOrCity: 'Carlisle',
      postcode: 'CA1 4DE',
      countryCode: 'United Kingdom',
      phone: '01228 555 0107',
      email: 'delete-freeze@example.co.uk',
    });

    const referenceNumber = await seededJourney.createDraftNotification('readyToSubmit');
    await seededJourney.resumeInUi(referenceNumber, pages.notificationView);
    await pages.notificationView.changeLink('Change roles and addresses').click();
    await pages.addresses.changeParty('Place of origin').click();
    await pages.placeOfOriginSelection.select(originalName);
    await pages.placeOfOriginSelection.saveAndContinue.click();
    await pages.addresses.continueButton.click();

    const originRow = pages.notificationView.partyRow('Roles and addresses', 'Place of origin');
    await expect(originRow).toContainText(originalName);

    await pages.notificationView.continueButton.click();
    await pages.declaration.confirmation.check();
    await pages.declaration.continueButton.click();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();

    await addressBookApi.deleteAddress(address.id);

    await notificationActions.toNotificationView(referenceNumber);
    await expect(pages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(pages.page.locator('.govuk-error-summary')).toHaveCount(0);
  });
});

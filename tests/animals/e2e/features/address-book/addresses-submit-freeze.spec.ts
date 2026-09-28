import { test, expect } from '@fixtures';

test.describe('Submitted addresses are frozen', { tag: ['@integration'] }, () => {
  test('renaming the book after submit does not change the submitted view, then shows live on amend', async ({
    seededJourney,
    pages,
    animalsPages,
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
    await seededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);
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
      countryCode: 'United Kingdom',
      phone: '01228 555 0106',
      email: 'freeze@example.co.uk',
    });

    await notificationActions.toNotificationView(referenceNumber);
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(originRow).not.toContainText(renamed);
    await expect(originRow).not.toContainText('Penrith');

    await notificationActions.amendNotification(referenceNumber);
    await animalsPages.overview.reviewAndSubmitButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Amending');
    await expect(originRow).toContainText(renamed);
    await expect(originRow).toContainText('Penrith');
    await expect(originRow).not.toContainText(originalName);

    await animalsPages.notificationView.cancelAmendment.click();
    await animalsPages.notificationCancelAmend.confirm.click();
    await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).not.toContainText(renamed);
  });

  test('deleting the book record after submit does not change the submitted view or error', async ({
    seededJourney,
    pages,
    animalsPages,
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
    await seededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);
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

    await notificationActions.toNotificationView(referenceNumber);
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(originRow).toContainText(originalName);
    await expect(originRow).toContainText('Carlisle');
    await expect(pages.page.locator('.govuk-error-summary')).toHaveCount(0);
  });
});

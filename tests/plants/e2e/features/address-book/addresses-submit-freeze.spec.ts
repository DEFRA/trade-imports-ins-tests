import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';

test.describe('Submitted addresses keep their copy', () => {
  test('renaming the book after submit changes neither the submitted view nor the amendment, and cancelling the amendment keeps the copy', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
    plantsNotificationActions,
  }) => {
    test.slow();

    const renamed = `Renamed Destination ${randomUUID()}`;
    const { reference, address } = await plantsJourney.completeNotification(addressBookApi);
    const destination = plantsPages.notificationView.card('Place of destination');
    await expect(destination).toContainText(address.name);

    await plantsJourney.submitFromReview();

    await addressBookApi.updateAddress(address.id, {
      name: renamed,
      addressLine1: '4 Nursery Lane',
      townOrCity: 'Dundee',
      postcode: 'DD1 1AA',
      countryCode: 'GB',
      phone: '01738 555 0143',
      email: 'review@example.co.uk',
    });

    await plantsNotificationActions.toNotificationView(reference);
    await expect(plantsPages.notificationView.statusTag).toHaveText('Submitted');
    await expect(destination).toContainText(address.name);
    await expect(destination).toContainText('Perth');
    await expect(destination).not.toContainText(renamed);
    await expect(destination).not.toContainText('Dundee');

    await plantsNotificationActions.amendNotification(reference);
    await plantsNotificationActions.toNotificationView(reference);
    await expect(plantsPages.notificationView.statusTag).toHaveText('Amend');
    await expect(destination).toContainText(address.name);
    await expect(destination).toContainText('Perth');
    await expect(destination).not.toContainText(renamed);
    await expect(destination).not.toContainText('Dundee');

    await plantsNotificationActions.cancelAmend(reference);
    await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
    await expect(plantsPages.notificationView.statusTag).toHaveText('Submitted');
    await expect(destination).toContainText(address.name);
    await expect(destination).toContainText('Perth');
    await expect(destination).not.toContainText(renamed);
  });

  test('deleting the book record after submit changes neither the submitted view nor the amendment, and shows no error', async ({
    plantsPages,
    plantsJourney,
    addressBookApi,
    plantsNotificationActions,
  }) => {
    test.slow();

    const { reference, address } = await plantsJourney.completeNotification(addressBookApi);
    const destination = plantsPages.notificationView.card('Place of destination');
    await expect(destination).toContainText(address.name);

    await plantsJourney.submitFromReview();

    await addressBookApi.deleteAddress(address.id);

    await plantsNotificationActions.toNotificationView(reference);
    await expect(plantsPages.notificationView.statusTag).toHaveText('Submitted');
    await expect(destination).toContainText(address.name);
    await expect(destination).toContainText('Perth');
    await expect(plantsPages.notificationView.errorSummary).toHaveCount(0);

    await plantsNotificationActions.amendNotification(reference);
    await plantsNotificationActions.toNotificationView(reference);
    await expect(plantsPages.notificationView.statusTag).toHaveText('Amend');
    await expect(destination).toContainText(address.name);
    await expect(destination).toContainText('Perth');
    await expect(plantsPages.notificationView.errorSummary).toHaveCount(0);
  });
});

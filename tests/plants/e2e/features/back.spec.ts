import { test, expect } from '@fixtures';

test.describe('Back on the review page', () => {
  test('after Save and continue from the contact address it opens the contact address, and Back steps back through the pages Save and continue was pressed on', async ({
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    await plantsJourney.completeNotification(addressBookApi);

    await plantsPages.notificationView.linkBack.click();
    await expect(plantsPages.consignmentContactSelect.heading).toBeVisible();

    await plantsPages.consignmentContactSelect.linkBack.click();
    await expect(plantsPages.identificationNumbers.heading).toBeVisible();

    await plantsPages.identificationNumbers.linkBack.click();
    await expect(plantsPages.placeOfDestination.heading).toBeVisible();
  });

  test('opened by Amend on a submitted notification dashboard card it opens the dashboard, before and after a Change link round trip', async ({
    plantsPages,
    plantsJourney,
    plantsNotificationActions,
    addressBookApi,
  }) => {
    const reference = await plantsNotificationActions.amendCompletedNotification(plantsJourney, addressBookApi);

    await plantsPages.notificationView.linkBack.click();
    await expect(plantsPages.dashboard.heading).toBeVisible();
    await plantsNotificationActions.cancelAmend(reference);
    await plantsNotificationActions.amendNotification(reference);
    await expect(plantsPages.notificationView.heading).toBeVisible();

    await plantsPages.notificationView.change('Change country of origin (Import details)').click();
    await expect(plantsPages.origin.heading).toBeVisible();
    await plantsPages.origin.linkBack.click();
    await expect(plantsPages.notificationView.heading).toBeVisible();

    await plantsPages.notificationView.linkBack.click();
    await expect(plantsPages.dashboard.heading).toBeVisible();
  });

  test('after a page opened by a Change link is refreshed, its Back still opens the review', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    await plantsJourney.completeNotification(addressBookApi);
    await plantsPages.notificationView.change('Change country of origin (Import details)').click();
    await expect(plantsPages.origin.heading).toBeVisible();

    await pages.page.reload();
    await plantsPages.origin.linkBack.click();

    await expect(plantsPages.notificationView.heading).toBeVisible();
  });

  test('after Continue is refused it still opens the contact address', async ({ plantsPages, plantsJourney, addressBookApi }) => {
    await plantsJourney.completeNotification(addressBookApi, { contact: false });

    await plantsPages.notificationView.btnContinue.click();
    await expect(plantsPages.notificationView.errorSummary).toBeVisible();

    await plantsPages.notificationView.linkBack.click();
    await expect(plantsPages.consignmentContactSelect.heading).toBeVisible();
  });
});

test.describe('Back from the first page', () => {
  test('after Start a new notification it opens the dashboard', async ({ plantsPages, plantsJourney }) => {
    await plantsJourney.startNotification();

    await plantsPages.commodityType.linkBack.click();

    await expect(plantsPages.dashboard.heading).toBeVisible();
  });
});

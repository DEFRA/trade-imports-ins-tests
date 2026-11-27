import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the cancel-amendment and delete confirmation pages have no accessibility violations', async ({
    animalsJourney,
    journeyContext,
    pages,
    animalsPages,
    runA11yScan,
  }) => {
    test.slow();
    await animalsJourney.submitNotification();
    const { referenceNumber } = journeyContext;

    await test.step('Amending: Overview, the notification view and the cancel-amendment confirmation', async () => {
      await animalsPages.dashboard.open();
      await animalsPages.dashboard.searchForReference(referenceNumber);
      await animalsPages.dashboard.amend(referenceNumber).click();
      await animalsPages.notificationView.heading.waitFor();
      await animalsPages.overview.open(referenceNumber);
      await animalsPages.overview.heading.waitFor();
      await runA11yScan();
      await animalsPages.notificationView.open(referenceNumber);
      await animalsPages.notificationView.heading.waitFor();
      await runA11yScan();
      await animalsPages.notificationView.btnCancelAmend.click();
      await animalsPages.notificationCancelAmend.heading.waitFor();
      await runA11yScan();
      await animalsPages.notificationCancelAmend.confirm.click();
      await pages.page.waitForURL(/\/notification-view\?cancelled=1$/);
    });

    await test.step('Notification restored to submitted after cancelling', async () => {
      await runA11yScan();
    });

    await test.step('Delete this notification?', async () => {
      await animalsPages.dashboard.open();
      await animalsPages.dashboard.searchFor(referenceNumber);
      await animalsPages.dashboard.delete(referenceNumber).click();
      await pages.page.getByRole('heading', { name: 'Delete this notification?' }).waitFor();
      await runA11yScan();
    });

    await test.step('Notification deleted (success banner)', async () => {
      await animalsPages.deleteNotification.confirmDelete.click();
      await animalsPages.dashboard.deletedBanner.waitFor();
      await runA11yScan();
    });
  });
});
